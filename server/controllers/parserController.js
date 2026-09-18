/**
 * WhatsApp Message Parser Controller — V3 (Production-Ready)
 *
 * Uses the modular WhatsAppParserEngine for parsing.
 * Handles both manual paste (authenticated) and webhook (automated).
 */
const { supabase } = require('../config/supabase');
const { parseMessage } = require('../services/parser/WhatsAppParserEngine');
const { transcribeImage, isConfigured: ocrConfigured } = require('../services/OcrService');

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/parser/whatsapp  (authenticated — manual paste from UI)
// ────────────────────────────────────────────────────────────────────────────────
const parseWhatsAppMessage = (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = parseMessage(message);

    // Only reject when there is truly nothing to show — including invalid blocks.
    if (result.entries.length === 0 && result.invalidBlocks.length === 0) {
      return res.status(422).json({
        error: result.warnings.length > 0
          ? result.warnings.join(' ')
          : 'Could not parse any entries from the message. Please check the format.',
      });
    }

    res.json({
      entries: result.entries,
      duplicateEntries: result.duplicateEntries,
      invalidBlocks: result.invalidBlocks,
      warnings: result.warnings,
      shopsDetected: result.shopsDetected,
      majorityCode: result.majorityCode,
      distinctCodes: result.distinctCodes,
      duplicateCount: result.duplicateCount,
      differentCodeCount: result.differentCodeCount,
      totalEntries: result.totalEntries,
      totalParsed: result.totalParsed,
      totalFailed: result.totalFailed,
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse message' });
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/parser/whatsapp-webhook  (automated — WhatsApp incoming)
// ────────────────────────────────────────────────────────────────────────────────
const handleWhatsAppWebhook = async (req, res) => {
  try {
    let messageText = req.body.Body || req.body.message || req.body.text;

    // Support WhatsApp Cloud API nested structure
    if (!messageText && req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body) {
      messageText = req.body.entry[0].changes[0].value.messages[0].text.body;
    }

    if (!messageText?.trim()) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    // Resolve ownerId based on sender's mobile number
    let fromNumber = req.body.From || req.body.from;
    if (!fromNumber && req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from) {
      fromNumber = req.body.entry[0].changes[0].value.messages[0].from;
    }

    let ownerId = null;
    if (fromNumber) {
      const cleanPhone = fromNumber.replace(/\D/g, '');
      if (cleanPhone) {
        const last10 = cleanPhone.slice(-10);
        const { data: matchedSuppliers } = await supabase
          .from('suppliers')
          .select('owner_id')
          .like('mobile', `%${last10}`)
          .limit(1);
        if (matchedSuppliers?.length > 0) {
          ownerId = matchedSuppliers[0].owner_id;
        }
      }
    }

    // Fallback owner resolution
    if (!ownerId) {
      const { data: firstAdmin } = await supabase
        .from('users').select('id').eq('role', 'admin').eq('is_active', true).limit(1);
      if (firstAdmin?.length > 0) {
        ownerId = firstAdmin[0].id;
      } else {
        const { data: anyUser } = await supabase.from('users').select('id').limit(1);
        if (anyUser?.length > 0) ownerId = anyUser[0].id;
      }
    }

    // Parse using the new engine
    const parsed = parseMessage(messageText);
    const results = [];

    for (const entry of parsed.entries) {
      if (!entry.series_code) {
        results.push({ entry, status: 'skipped', reason: 'No series code found' });
        continue;
      }
      if (!entry.beam_name) {
        results.push({ entry, status: 'skipped', reason: 'No beam name found' });
        continue;
      }
      if (entry.stock === null) {
        results.push({ entry, status: 'skipped', reason: 'No stock quantity found' });
        continue;
      }

      // 1. Find the Saree by series_code
      const { data: sarees, error: sareeError } = await supabase
        .from('sarees').select('id, series_code, sari_name')
        .eq('owner_id', ownerId)
        .ilike('series_code', entry.series_code.trim())
        .limit(1);

      if (sareeError) throw sareeError;
      if (!sarees?.length) {
        results.push({ entry, status: 'skipped', reason: `Saree ${entry.series_code} not found` });
        continue;
      }
      const saree = sarees[0];

      // 2. Find or create Beam
      let { data: beams, error: beamError } = await supabase
        .from('beams').select('id, beam_name')
        .eq('saree_id', saree.id)
        .ilike('beam_name', entry.beam_name.trim())
        .limit(1);

      if (beamError) throw beamError;

      let beam;
      if (!beams?.length) {
        const { data: newBeam, error: createBeamError } = await supabase
          .from('beams')
          .insert({ saree_id: saree.id, beam_name: entry.beam_name.trim(), owner_id: ownerId })
          .select().single();
        if (createBeamError) throw createBeamError;
        beam = newBeam;
      } else {
        beam = beams[0];
      }

      // 3. Find matching combination by color fingerprint
      const { data: combos, error: comboError } = await supabase
        .from('combinations')
        .select(`id, combination_name, current_stock, minimum_stock,
                 combination_colors (f_number, color_name, company_name)`)
        .eq('beam_id', beam.id);

      if (comboError) throw comboError;

      const entryFp = (entry.colors || [])
        .map((c) => `${c.f_number.trim().toUpperCase()}:${c.color_name.trim().toLowerCase()}`)
        .sort().join('|');

      let matchedCombo = null;
      for (const combo of (combos || [])) {
        const comboFp = (combo.combination_colors || [])
          .map((c) => `${c.f_number.trim().toUpperCase()}:${c.color_name.trim().toLowerCase()}`)
          .sort().join('|');
        if (comboFp === entryFp) { matchedCombo = combo; break; }
      }

      let originalStock = 0;
      let finalStock = 0;
      let actionType = 'Manual Edit';
      let isNewCombo = false;

      if (matchedCombo) {
        originalStock = matchedCombo.current_stock || 0;
        if (entry.isRelative) {
          finalStock = Math.max(0, originalStock + (entry.relativeSign * entry.stock));
          actionType = entry.relativeSign > 0 ? 'Increase' : 'Decrease';
        } else {
          finalStock = entry.stock;
          actionType = 'Manual Edit';
        }

        const { error: updateError } = await supabase
          .from('combinations')
          .update({ current_stock: finalStock, updated_at: new Date().toISOString() })
          .eq('id', matchedCombo.id).eq('owner_id', ownerId);
        if (updateError) throw updateError;
      } else {
        isNewCombo = true;
        originalStock = 0;
        finalStock = entry.stock;

        const nextComboNum = (combos || []).length + 1;
        const comboName = `Combination ${nextComboNum}`;

        const { data: newCombo, error: insertComboError } = await supabase
          .from('combinations')
          .insert({
            beam_id: beam.id, combination_name: comboName,
            current_stock: finalStock, minimum_stock: 20,
            sort_order: (combos || []).length, owner_id: ownerId,
          })
          .select().single();

        if (insertComboError) throw insertComboError;

        if (entry.colors?.length > 0) {
          const colorsPayload = entry.colors.map((col) => ({
            combination_id: newCombo.id, f_number: col.f_number,
            color_name: col.color_name, company_name: col.company_name,
            owner_id: ownerId,
          }));
          const { error: insertColorsError } = await supabase
            .from('combination_colors').insert(colorsPayload);
          if (insertColorsError) throw insertColorsError;
        }

        matchedCombo = { id: newCombo.id, combination_name: comboName };
      }

      // 4. Log Stock History
      const quantityChanged = finalStock - originalStock;
      const actionDisplay = actionType === 'Increase' ? 'Stock Added' : actionType === 'Decrease' ? 'Delivery' : 'Manual Edit';
      const reasonCategory = actionType === 'Increase' ? 'WhatsApp Purchase Request' : 'WhatsApp Adjustment';

      await supabase.from('stock_history').insert({
        saree_id: saree.id, combination_id: matchedCombo.id,
        beam_name: beam.beam_name, combination_name: matchedCombo.combination_name,
        old_stock: originalStock, new_stock: finalStock,
        action: actionType,
        reason: JSON.stringify({
          sari_number: saree.series_code || 'UNKNOWN',
          beam_name: beam.beam_name || 'UNKNOWN',
          combination_name: matchedCombo.combination_name || 'Combination',
          action: actionDisplay, opening_stock: originalStock,
          quantity_changed: quantityChanged, closing_stock: finalStock,
          reason_category: reasonCategory,
          remarks: isNewCombo ? 'Created via WhatsApp Incoming' : 'Updated via WhatsApp Incoming',
          user_name: 'WhatsApp System',
        }),
        owner_id: ownerId, changed_by_name: 'WhatsApp System',
      });

      // 5. Log Activity
      await supabase.from('activity_logs').insert({
        action: isNewCombo ? 'CREATE_COMBINATION_WHATSAPP' : 'UPDATE_STOCK_WHATSAPP',
        entity_type: 'combination', entity_id: matchedCombo.id,
        user_name: 'WhatsApp System', owner_id: ownerId,
        details: {
          saree_code: saree.series_code, beam_name: beam.beam_name,
          combination_name: matchedCombo.combination_name,
          old_stock: originalStock, new_stock: finalStock,
          message: messageText,
        },
      });

      results.push({
        entry, status: 'success',
        action: isNewCombo ? 'created' : 'updated',
        saree_code: saree.series_code, beam_name: beam.beam_name,
        combination_name: matchedCombo.combination_name,
        old_stock: originalStock, new_stock: finalStock,
      });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Incoming Webhook error:', error);
    res.status(500).json({ error: 'Internal server error processing incoming message' });
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/parser/ocr  (authenticated — WhatsApp screenshot → raw text)
// Multipart field "image". Returns the transcribed text; the client then runs it
// through the SAME parse+validate pipeline as pasted text.
// ────────────────────────────────────────────────────────────────────────────────
const ocrWhatsAppImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded. Attach a screenshot as "image".' });
    }
    const text = await transcribeImage(req.file.buffer, req.file.mimetype);
    res.json({ text });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500 && status !== 501 && status !== 502) console.error('OCR error:', error);
    res.status(status).json({ error: error.message || 'Failed to read text from the image.' });
  }
};

// GET /api/parser/ocr-status — lets the UI show/hide the screenshot button.
const ocrStatus = (req, res) => res.json({ enabled: ocrConfigured() });

module.exports = { parseWhatsAppMessage, handleWhatsAppWebhook, ocrWhatsAppImage, ocrStatus };
