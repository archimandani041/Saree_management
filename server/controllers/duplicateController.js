/**
 * Duplicate Detection Controller
 * POST /api/duplicates/check-saree
 * POST /api/duplicates/check-beam
 * POST /api/duplicates/check-combination
 * POST /api/duplicates/check-whatsapp-batch
 */
const {
  checkSaree,
  checkBeam,
  checkCombination,
  checkWhatsAppBatch,
} = require('../services/DuplicateDetectionService');

// POST /api/duplicates/check-saree
const checkSareeEndpoint = async (req, res) => {
  try {
    const { series_code, exclude_id } = req.body;
    if (!series_code?.trim())
      return res.status(400).json({ error: 'series_code is required' });
    const result = await checkSaree(series_code, req.user.owner_id, exclude_id || null);
    res.json(result);
  } catch (e) {
    console.error('checkSaree error:', e);
    res.status(500).json({ error: 'Duplicate check failed' });
  }
};

// POST /api/duplicates/check-beam
const checkBeamEndpoint = async (req, res) => {
  try {
    const { saree_id, beam_name, exclude_beam_id } = req.body;
    if (!saree_id || !beam_name?.trim())
      return res.status(400).json({ error: 'saree_id and beam_name are required' });
    const result = await checkBeam(saree_id, beam_name, req.user.owner_id, exclude_beam_id || null);
    res.json(result);
  } catch (e) {
    console.error('checkBeam error:', e);
    res.status(500).json({ error: 'Duplicate check failed' });
  }
};

// POST /api/duplicates/check-combination
const checkCombinationEndpoint = async (req, res) => {
  try {
    const { beam_id, combination_name, colors, image_url, exclude_combo_id } = req.body;
    if (!beam_id)
      return res.status(400).json({ error: 'beam_id is required' });
    const result = await checkCombination(
      beam_id,
      { combination_name, colors: colors || [], image_url: image_url || null },
      req.user.owner_id,
      exclude_combo_id || null
    );
    res.json(result);
  } catch (e) {
    console.error('checkCombination error:', e);
    res.status(500).json({ error: 'Duplicate check failed' });
  }
};

// POST /api/duplicates/check-whatsapp-batch
const checkWhatsAppBatchEndpoint = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0)
      return res.status(400).json({ error: 'entries array is required' });
    const results = await checkWhatsAppBatch(entries, req.user.owner_id);
    res.json({ results });
  } catch (e) {
    console.error('checkWhatsAppBatch error:', e);
    res.status(500).json({ error: 'Batch duplicate check failed' });
  }
};

module.exports = {
  checkSareeEndpoint,
  checkBeamEndpoint,
  checkCombinationEndpoint,
  checkWhatsAppBatchEndpoint,
};
