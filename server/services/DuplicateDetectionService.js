/**
 * DuplicateDetectionService
 *
 * Provides all six levels of duplicate checking:
 *  L1 – Saree (series_code uniqueness)
 *  L2 – Beam (beam_name per saree)
 *  L3 – Combination (full fingerprint)
 *  L4 – Smart color comparison (case + whitespace insensitive)
 *  L5 – Image conflict on otherwise-identical combination
 *  L6 – WhatsApp import similarity scoring
 *
 * All checks are owner-scoped and return structured results
 * that the API can forward directly to the client.
 */
const { supabase } = require('../config/supabase');

// ─────────────────────────────────────────────────────────────────────────────
// String helpers
// ─────────────────────────────────────────────────────────────────────────────
const normalizeStr = (s) =>
  (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

const colorKey = (c) =>
  `${normalizeStr(c.f_number)}:${normalizeStr(c.color_name)}:${normalizeStr(c.company_name)}`;

/**
 * Sort and fingerprint a color array for exact-match comparison.
 */
const colorFingerprint = (colors = []) =>
  [...colors]
    .map(colorKey)
    .sort()
    .join('|');

/**
 * Calculate similarity score (0–100) between two color arrays.
 * Returns % of new colors that have an exact match in existing.
 */
const colorSimilarity = (existingColors = [], incomingColors = []) => {
  if (incomingColors.length === 0 && existingColors.length === 0) return 100;
  if (incomingColors.length === 0 || existingColors.length === 0) return 0;

  const existSet = new Set(existingColors.map(colorKey));
  const matchCount = incomingColors.filter((c) => existSet.has(colorKey(c))).length;
  const unionSize = new Set([...existingColors.map(colorKey), ...incomingColors.map(colorKey)]).size;
  return Math.round((matchCount / unionSize) * 100);
};

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 1 – Saree duplicate check
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @returns {{ isDuplicate: boolean, existingId?: string, existingCode?: string }}
 */
const checkSaree = async (seriesCode, ownerId, excludeId = null) => {
  let q = supabase
    .from('sarees')
    .select('id, series_code, sari_name')
    .eq('owner_id', ownerId)
    .ilike('series_code', seriesCode.trim().toUpperCase())
    .limit(1);
  if (excludeId) q = q.neq('id', excludeId);

  const { data } = await q;
  if (data?.length > 0) {
    return { isDuplicate: true, existingId: data[0].id, existingCode: data[0].series_code, existingName: data[0].sari_name };
  }
  return { isDuplicate: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 2 – Beam duplicate check
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @returns {{ isDuplicate: boolean, existingBeamId?: string }}
 */
const checkBeam = async (sareeId, beamName, ownerId, excludeBeamId = null) => {
  let q = supabase
    .from('beams')
    .select('id, beam_name')
    .eq('saree_id', sareeId)
    .eq('owner_id', ownerId)
    .ilike('beam_name', beamName.trim())
    .limit(1);
  if (excludeBeamId) q = q.neq('id', excludeBeamId);

  const { data } = await q;
  if (data?.length > 0) {
    return { isDuplicate: true, existingBeamId: data[0].id, existingBeamName: data[0].beam_name };
  }
  return { isDuplicate: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 3+4 – Combination duplicate/similarity check
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Check a single combination (with colors) against all existing combinations
 * in the given beam.
 *
 * @param {string} beamId
 * @param {{ combination_name, colors: [{f_number, color_name, company_name}] }} incoming
 * @param {string} ownerId
 * @param {string|null} excludeComboId
 *
 * @returns {{
 *   status: 'DUPLICATE' | 'SIMILAR' | 'IMAGE_CONFLICT' | 'NEW',
 *   score: number,          // 0–100
 *   existingCombo?: object, // matched combination
 *   diff?: object           // added/removed/changed colors
 * }}
 */
const checkCombination = async (beamId, incoming, ownerId, excludeComboId = null) => {
  // Fetch all existing combinations in this beam with their colors
  let q = supabase
    .from('combinations')
    .select('id, combination_name, image_url, combination_colors(f_number, color_name, company_name)')
    .eq('beam_id', beamId)
    .eq('owner_id', ownerId);
  if (excludeComboId) q = q.neq('id', excludeComboId);

  const { data: combos } = await q;
  if (!combos?.length) return { status: 'NEW', score: 0 };

  const incomingFp = colorFingerprint(incoming.colors);
  const incomingNameNorm = normalizeStr(incoming.combination_name);

  let bestMatch = null;
  let bestScore = 0;

  for (const combo of combos) {
    // Weighted scoring:  series 40 / beam already same / name 20 / colors 40
    let score = 0;

    // Name similarity (20 pts)
    const existingNameNorm = normalizeStr(combo.combination_name);
    if (incomingNameNorm && existingNameNorm && incomingNameNorm === existingNameNorm) {
      score += 20;
    } else if (incomingNameNorm && existingNameNorm) {
      // partial: starts with
      if (existingNameNorm.startsWith(incomingNameNorm) || incomingNameNorm.startsWith(existingNameNorm)) {
        score += 10;
      }
    }

    // Color similarity (80 pts because beam is fixed here)
    const existingColors = combo.combination_colors || [];
    const existingFp = colorFingerprint(existingColors);
    const colorSim = colorSimilarity(existingColors, incoming.colors || []);
    score += Math.round(colorSim * 0.8);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { combo, colorSim, existingFp };
    }
  }

  if (!bestMatch) return { status: 'NEW', score: 0 };

  const { combo, colorSim, existingFp } = bestMatch;
  const incomingColorsFp = colorFingerprint(incoming.colors);

  // Exact duplicate: name + all colors match
  if (colorSim === 100 && normalizeStr(combo.combination_name) === incomingNameNorm) {
    // Level 5: Image conflict?
    const hasImageConflict = !!(incoming.image_url && combo.image_url && incoming.image_url !== combo.image_url);
    if (hasImageConflict) {
      return {
        status: 'IMAGE_CONFLICT',
        score: 100,
        existingCombo: combo,
        diff: buildDiff(combo.combination_colors || [], incoming.colors || []),
      };
    }
    return {
      status: 'DUPLICATE',
      score: 100,
      existingCombo: combo,
      diff: null,
    };
  }

  // Similar: score 80–99
  if (bestScore >= 80) {
    return {
      status: 'SIMILAR',
      score: bestScore,
      existingCombo: combo,
      diff: buildDiff(combo.combination_colors || [], incoming.colors || []),
    };
  }

  // New combination
  return { status: 'NEW', score: bestScore };
};

/**
 * Build a human-readable color diff between existing and incoming.
 */
const buildDiff = (existingColors, incomingColors) => {
  const existMap = new Map(existingColors.map((c) => [normalizeStr(c.f_number), c]));
  const inMap = new Map(incomingColors.map((c) => [normalizeStr(c.f_number), c]));

  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  for (const [fNum, incoming] of inMap) {
    if (!existMap.has(fNum)) {
      added.push(incoming);
    } else {
      const existing = existMap.get(fNum);
      if (colorKey(existing) !== colorKey(incoming)) {
        changed.push({ f_number: incoming.f_number, from: existing, to: incoming });
      } else {
        unchanged.push(incoming);
      }
    }
  }
  for (const [fNum, existing] of existMap) {
    if (!inMap.has(fNum)) removed.push(existing);
  }

  return { added, removed, changed, unchanged };
};

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL 6 – WhatsApp import batch check
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Given parsed WhatsApp entries, run full duplicate detection for each one
 * and return enriched entries with status tags.
 *
 * @param {Array} entries  – parsed entries from WhatsAppParserEngine
 * @param {string} ownerId
 *
 * @returns {Array<{ entry, status, score, existingCombo, diff, existingSareeId, existingBeamId }>}
 */
const checkWhatsAppBatch = async (entries, ownerId) => {
  const results = [];

  for (const entry of entries) {
    const result = { entry, status: 'NEW', score: 0, existingCombo: null, diff: null, existingSareeId: null, existingBeamId: null };

    // L1: Saree check
    if (entry.series_code) {
      const sareeCheck = await checkSaree(entry.series_code, ownerId);
      if (!sareeCheck.isDuplicate) {
        result.status = 'NEW_SAREE';
        results.push(result);
        continue;
      }
      result.existingSareeId = sareeCheck.existingId;
    } else {
      result.status = 'MISSING_SERIES';
      results.push(result);
      continue;
    }

    // L2: Beam check
    if (entry.beam_name && result.existingSareeId) {
      const beamCheck = await checkBeam(result.existingSareeId, entry.beam_name, ownerId);
      if (!beamCheck.isDuplicate) {
        result.status = 'NEW_BEAM';
        results.push(result);
        continue;
      }
      result.existingBeamId = beamCheck.existingBeamId;
    } else if (!entry.beam_name) {
      result.status = 'MISSING_BEAM';
      results.push(result);
      continue;
    }

    // L3+4: Combination similarity check
    if (result.existingBeamId) {
      const comboCheck = await checkCombination(result.existingBeamId, {
        combination_name: entry.combination_name,
        colors: entry.colors || [],
        image_url: entry.image_url || null,
      }, ownerId);

      result.status = comboCheck.status;
      result.score = comboCheck.score;
      result.existingCombo = comboCheck.existingCombo || null;
      result.diff = comboCheck.diff || null;
    }

    results.push(result);
  }

  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  checkSaree,
  checkBeam,
  checkCombination,
  checkWhatsAppBatch,
  colorFingerprint,
  colorSimilarity,
  buildDiff,
  normalizeStr,
};
