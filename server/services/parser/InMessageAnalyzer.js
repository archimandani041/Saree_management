/**
 * InMessageAnalyzer — cross-entry analysis WITHIN a single pasted message.
 *
 * Unlike the old DuplicateChecker (which silently dropped duplicates), this
 * analyzer PRESERVES every parsed entry and only *tags* it, so nothing is ever
 * lost before the user reviews it. It produces two independent signals:
 *
 *   1. duplicate_in_message — an exact repeat of an earlier entry
 *      (same series code + same combination + same colour set). Same code with a
 *      DIFFERENT combination/colour is NOT a duplicate — it is a separate
 *      combination of the same sari.
 *
 *   2. different_code — a sari code that differs from the majority code in the
 *      message (a likely mis-paste the user should review). The entry is kept.
 */

const normalize = (s) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

// Identity fingerprint: code + combination name + colour set (F-number:colour).
// Stock is deliberately excluded so a repeat with a conflicting quantity is still
// surfaced as a duplicate for the user to reconcile.
const identityFingerprint = (entry) => {
  const colorKey = (entry.colors || [])
    .map((c) => `${normalize(c.f_number)}:${normalize(c.color_name)}`)
    .sort()
    .join('|');
  return [
    // Shop is part of identity: KP + KS526F + F-1 and KPR + KS526F + F-1 are
    // DIFFERENT records and must never be flagged as duplicates of each other.
    (entry.brand || '').toUpperCase(),
    (entry.series_code || '').trim().toUpperCase(),
    normalize(entry.combination_name),
    colorKey,
  ].join('||');
};

const colorSummary = (entry) =>
  (entry.colors || []).map((c) => `${c.f_number} ${c.color_name}`).join(', ') || '(no colours)';

/**
 * Analyze parsed entries in place.
 * @param {Array} entries — parsed entries (mutated: flags added)
 * @returns {{ entries, majorityCode, distinctCodes, duplicateCount, differentCodeCount, warnings }}
 */
const analyze = (entries) => {
  const warnings = [];

  // ── 1. Exact in-message duplicates ────────────────────────────────────────
  const fpFirstSeen = new Map(); // fingerprint -> index of first occurrence
  let duplicateCount = 0;

  entries.forEach((entry, i) => {
    entry.duplicate_in_message = false;
    entry.duplicate_of = null;
    // Only meaningful for entries that actually carry a colour identity.
    if (!entry.series_code && (entry.colors || []).length === 0) return;

    const fp = identityFingerprint(entry);
    if (fpFirstSeen.has(fp)) {
      const firstIdx = fpFirstSeen.get(fp);
      entry.duplicate_in_message = true;
      entry.duplicate_of = {
        entryNumber: firstIdx + 1,
        series_code: entries[firstIdx].series_code,
        colorSummary: colorSummary(entries[firstIdx]),
      };
      duplicateCount += 1;
      warnings.push(
        `⚠️ Duplicate in message: ${entry.series_code || '(no code)'} — ${colorSummary(entry)} appears more than once (first seen as entry ${firstIdx + 1}).`
      );
    } else {
      fpFirstSeen.set(fp, i);
    }
  });

  // ── 2. Different / outlier sari codes ─────────────────────────────────────
  // Frequency of each distinct code (in first-appearance order for tie-breaks).
  // Group codes BY SHOP so a legitimate KPR code is never called an outlier just
  // because KP happens to have more entries in the message.
  const groups = new Map(); // brandKey -> Map(code -> freq)
  entries.forEach((e) => {
    const code = (e.series_code || '').trim().toUpperCase();
    if (!code) return;
    const bk = (e.brand || '').toUpperCase();
    if (!groups.has(bk)) groups.set(bk, new Map());
    const freq = groups.get(bk);
    freq.set(code, (freq.get(code) || 0) + 1);
  });

  const majorityByGroup = new Map();
  for (const [bk, freq] of groups) {
    const codes = [...freq.keys()];
    majorityByGroup.set(bk, codes.reduce((best, c) => (freq.get(c) > freq.get(best) ? c : best), codes[0]));
  }

  let differentCodeCount = 0;
  entries.forEach((entry) => {
    const code = (entry.series_code || '').trim().toUpperCase();
    const bk = (entry.brand || '').toUpperCase();
    const groupCodes = groups.has(bk) ? [...groups.get(bk).keys()] : [];
    entry.majority_code = majorityByGroup.get(bk) || null;
    entry.different_code = !!(code && groupCodes.length > 1 && code !== entry.majority_code);
    if (entry.different_code) differentCodeCount += 1;
  });

  // Overall most-frequent code (used only for the summary banner).
  const overall = new Map();
  for (const freq of groups.values()) for (const [c, n] of freq) overall.set(c, (overall.get(c) || 0) + n);
  const distinctCodes = [...overall.keys()];
  const majorityCode = distinctCodes.length
    ? distinctCodes.reduce((best, c) => (overall.get(c) > overall.get(best) ? c : best), distinctCodes[0])
    : null;

  // Per-shop outlier warnings.
  for (const [bk, majority] of majorityByGroup) {
    const outliers = [...new Set(entries.filter((e) => e.different_code && (e.brand || '').toUpperCase() === bk).map((e) => e.series_code))];
    if (outliers.length > 0) {
      const shopLabel = bk ? `${bk}: ` : '';
      warnings.push(
        `⚠️ ${shopLabel}Different sari code${outliers.length > 1 ? 's' : ''} detected: ${outliers.join(', ')} differ${outliers.length > 1 ? '' : 's'} from the main code ${majority}. Kept for your review.`
      );
    }
  }

  return {
    entries,
    majorityCode,
    distinctCodes,
    duplicateCount,
    differentCodeCount,
    warnings,
  };
};

module.exports = { analyze, identityFingerprint };
