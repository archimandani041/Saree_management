/**
 * WhatsAppParserEngine — Main orchestrator.
 *
 * Coordinates all parser services:
 *   NoiseFilter → BlockSplitter → BlockParser → DuplicateChecker
 *
 * Returns a complete parse result with entries, duplicates,
 * warnings, confidence scores, and error recovery info.
 */

const NoiseFilter = require('./NoiseFilter');
const BlockSplitter = require('./BlockSplitter');
const BlockParser = require('./BlockParser');
const DuplicateChecker = require('./DuplicateChecker');

/**
 * Parse a raw WhatsApp message into structured entries.
 * @param {string} rawMessage — the full pasted text
 * @returns {{ entries, duplicateEntries, warnings, totalParsed, totalFailed, totalEntries }}
 */
const parseMessage = (rawMessage) => {
  if (!rawMessage?.trim()) {
    return { entries: [], duplicateEntries: [], warnings: ['Empty message'], totalParsed: 0, totalFailed: 0, totalEntries: 0 };
  }

  // 1. Filter noise
  const lines = NoiseFilter.filterLines(rawMessage);
  if (lines.length === 0) {
    return { entries: [], duplicateEntries: [], warnings: ['No usable content found after filtering noise.'], totalParsed: 0, totalFailed: 0, totalEntries: 0 };
  }

  // 2. Split into blocks
  const blocks = BlockSplitter.split(lines);

  // 3. Parse each block independently (error recovery: never stop on failure)
  const allParsed = [];
  const failed = [];

  for (let i = 0; i < blocks.length; i++) {
    try {
      const entry = BlockParser.parse(blocks[i]);
      // Only include if at least one useful field was detected
      if (entry.beam_name || entry.series_code || entry.colors.length > 0 || entry.stock !== null) {
        allParsed.push(entry);
      } else {
        failed.push({ blockIndex: i, reason: 'No recognizable fields found', lines: blocks[i] });
      }
    } catch (err) {
      failed.push({ blockIndex: i, reason: err.message, lines: blocks[i] });
    }
  }

  // 4. Deduplicate
  const { unique, duplicates } = DuplicateChecker.dedup(allParsed);

  // 5. Generate warnings
  const warnings = [];
  unique.forEach((entry, i) => {
    const prefix = unique.length > 1 ? `Entry ${i + 1}: ` : '';
    entry.parseErrors.forEach((err) => warnings.push(`${prefix}${err}`));
  });

  if (failed.length > 0) {
    warnings.push(`${failed.length} block(s) could not be parsed and were skipped.`);
  }

  // Clean up internal fields before returning
  const cleanEntries = unique.map((e) => {
    const { _rawLines, parseErrors, ...rest } = e;
    return { ...rest, parseErrors };
  });

  return {
    entries: cleanEntries,
    duplicateEntries: duplicates,
    warnings,
    totalParsed: unique.length,
    totalFailed: failed.length,
    totalEntries: unique.length,
  };
};

module.exports = { parseMessage };
