/**
 * DuplicateChecker — Detects duplicate entries.
 * Generates fingerprints for comparison within a parsed batch
 * and (optionally) against existing DB data.
 */

/**
 * Generate a fingerprint string for deduplication.
 */
const fingerprint = (entry) => {
  const colorKey = (entry.colors || [])
    .map((c) => `${(c.f_number || '').trim().toUpperCase()}:${(c.color_name || '').trim().toLowerCase()}`)
    .sort()
    .join('|');
  return [
    (entry.beam_name || '').trim().toLowerCase(),
    (entry.series_code || '').trim().toUpperCase(),
    String(entry.stock ?? ''),
    colorKey,
  ].join('||');
};

/**
 * Deduplicate an array of parsed entries.
 * Returns { unique: [], duplicates: [{ entry, duplicateOf }] }
 */
const dedup = (entries) => {
  const fpMap = new Map();
  const unique = [];
  const duplicates = [];

  for (const entry of entries) {
    const fp = fingerprint(entry);
    if (fpMap.has(fp)) {
      const origIdx = fpMap.get(fp);
      const original = unique[origIdx];
      duplicates.push({
        entry,
        duplicateOf: {
          entryNumber: origIdx + 1,
          beam_name: original.beam_name,
          series_code: original.series_code,
          stock: original.stock,
          colorSummary: (original.colors || []).map((c) => `${c.f_number}: ${c.color_name}`).join(', '),
        },
      });
    } else {
      fpMap.set(fp, unique.length);
      unique.push(entry);
    }
  }

  return { unique, duplicates };
};

module.exports = { fingerprint, dedup };
