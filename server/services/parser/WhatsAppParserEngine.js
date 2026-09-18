/**
 * WhatsAppParserEngine — Main orchestrator.
 *
 * Pipeline:
 *   NoiseFilter → BlockSplitter → BlockParser → InMessageAnalyzer
 *
 * Design principle (per product spec): ACCURACY & TRACEABILITY OVER AUTOMATION.
 * Every recognised entry is preserved and returned — duplicates and outlier
 * codes are TAGGED, never silently removed or merged. The caller (and the user)
 * can always see exactly what was extracted from the message.
 */

const NoiseFilter = require('./NoiseFilter');
const BlockSplitter = require('./BlockSplitter');
const BlockParser = require('./BlockParser');
const InMessageAnalyzer = require('./InMessageAnalyzer');
const ShopParser = require('./ShopParser');

/**
 * Partition cleaned lines into shop sections. A bare "KP"/"KPR" line switches the
 * active shop for everything that follows and is itself dropped. Lines before any
 * shop marker belong to a section with brand=null (the caller supplies the shop).
 * @returns {Array<{ brand: string|null, lines: string[] }>}
 */
const partitionByShop = (lines) => {
  const sections = [];
  let current = { brand: null, lines: [] };
  for (const line of lines) {
    const shop = ShopParser.parse(line);
    if (shop) {
      if (current.lines.length) sections.push(current);
      current = { brand: shop.brand, lines: [] };
      continue; // drop the marker line itself
    }
    current.lines.push(line);
  }
  if (current.lines.length) sections.push(current);
  return sections.length ? sections : [{ brand: null, lines }];
};

/**
 * Parse a raw WhatsApp message into structured, fully-tagged entries.
 * @param {string} rawMessage — the full pasted text
 * @returns {{
 *   entries, warnings, majorityCode, distinctCodes,
 *   duplicateEntries, invalidBlocks,
 *   totalParsed, totalFailed, totalEntries, duplicateCount, differentCodeCount
 * }}
 */
const parseMessage = (rawMessage) => {
  const empty = {
    entries: [], warnings: [], shopsDetected: [], majorityCode: null, distinctCodes: [],
    duplicateEntries: [], invalidBlocks: [],
    totalParsed: 0, totalFailed: 0, totalEntries: 0, duplicateCount: 0, differentCodeCount: 0,
  };

  if (!rawMessage?.trim()) {
    return { ...empty, warnings: ['Empty message'] };
  }

  // 1. Filter noise (timestamps, sender names, emojis, blank lines, …)
  const lines = NoiseFilter.filterLines(rawMessage);
  if (lines.length === 0) {
    return { ...empty, warnings: ['No usable content found after filtering noise.'] };
  }

  // 2. Partition into shop (KP/KPR) sections so each entry can be shop-tagged.
  const sections = partitionByShop(lines);
  const shopsDetected = [...new Set(sections.map((s) => s.brand).filter(Boolean))];

  // 3. Split each section into blocks and parse — never stop on a single failure.
  const parsed = [];
  const invalidBlocks = [];
  let blockCounter = 0;

  for (const section of sections) {
    const blocks = BlockSplitter.split(section.lines);
    for (let i = 0; i < blocks.length; i++) {
      const idx = blockCounter++;
      try {
        const entry = BlockParser.parse(blocks[i]);
        // Recognisable if it has ANY meaningful field; otherwise keep the raw text
        // as an explicit "invalid / unrecognised" record so nothing is lost.
        if (entry.series_code || entry.colors.length > 0 || entry.beam_name || entry.stock !== null) {
          entry.brand = section.brand; // null when no shop marker — caller supplies it
          parsed.push(entry);
        } else {
          invalidBlocks.push({ blockIndex: idx, raw_text: blocks[i].join('\n'), reason: 'No recognizable sari fields', brand: section.brand });
        }
      } catch (err) {
        invalidBlocks.push({ blockIndex: idx, raw_text: (blocks[i] || []).join('\n'), reason: err.message, brand: section.brand });
      }
    }
  }

  // 4. Cross-entry analysis — tag (never drop) in-message duplicates & outlier codes.
  const analysis = InMessageAnalyzer.analyze(parsed);

  // 5. Collect warnings: per-entry parse notes + cross-entry findings.
  const warnings = [];
  parsed.forEach((entry, i) => {
    const prefix = parsed.length > 1 ? `Entry ${i + 1}: ` : '';
    (entry.color_warnings || []).forEach((w) => {
      warnings.push(`${prefix}Duplicate ${w.f_number} within this combination${w.sameColor ? ' (same colour repeated)' : ` (also "${w.duplicateOfColor}")`}.`);
    });
  });
  warnings.push(...analysis.warnings);
  if (invalidBlocks.length > 0) {
    warnings.push(`${invalidBlocks.length} block(s) could not be recognised — shown as "Invalid" for manual review.`);
  }

  // 6. Strip internal-only fields before returning.
  const cleanEntries = parsed.map((e) => {
    const { _rawLines, ...rest } = e;
    return rest;
  });

  // Backward-compatible view: the flagged duplicates (kept in `entries` too).
  const duplicateEntries = cleanEntries
    .filter((e) => e.duplicate_in_message)
    .map((e) => ({ entry: e, duplicateOf: e.duplicate_of }));

  return {
    entries: cleanEntries,
    warnings,
    shopsDetected,
    majorityCode: analysis.majorityCode,
    distinctCodes: analysis.distinctCodes,
    duplicateEntries,
    invalidBlocks,
    totalParsed: cleanEntries.length,
    totalFailed: invalidBlocks.length,
    totalEntries: cleanEntries.length,
    duplicateCount: analysis.duplicateCount,
    differentCodeCount: analysis.differentCodeCount,
  };
};

module.exports = { parseMessage };
