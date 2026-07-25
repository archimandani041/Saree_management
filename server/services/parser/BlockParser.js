/**
 * BlockParser — Parses a single block of lines into a structured entry.
 * Order-independent: each line is tested against all parsers.
 */

const BeamParser = require('./BeamParser');
const SeriesParser = require('./SeriesParser');
const CombinationParser = require('./CombinationParser');
const ColorParser = require('./ColorParser');
const StockParser = require('./StockParser');

const parse = (lines) => {
  const entry = {
    beam_name: null,
    series_code: null,
    series_base: null,
    series_letter: null,
    combination_name: null,
    stock: null,
    isRelative: false,
    relativeSign: 1,
    colors: [],
    confidence: 0,
    parseErrors: [],
    _rawLines: lines,
  };

  for (const line of lines) {
    // 1. Beam
    if (!entry.beam_name) {
      const r = BeamParser.parse(line);
      if (r) { entry.beam_name = r.beam_name; continue; }
    }
    // 2. Series + combo name
    if (!entry.series_code) {
      const r = SeriesParser.parse(line);
      if (r) {
        entry.series_code = r.series_code;
        entry.series_base = r.series_base;
        entry.series_letter = r.series_letter;
        if (r.combination_name) entry.combination_name = r.combination_name;
        continue;
      }
    }
    // 3. F-Color
    const cr = ColorParser.parse(line);
    if (cr) { entry.colors.push(cr); continue; }
    // 4. Stock
    if (entry.stock === null) {
      const sr = StockParser.parse(line);
      if (sr) {
        entry.stock = sr.stock;
        entry.isRelative = sr.isRelative;
        entry.relativeSign = sr.relativeSign;
        continue;
      }
    }
    // 5. Standalone Combination Name
    if (!entry.combination_name) {
      const cr2 = CombinationParser.parse(line);
      if (cr2) { entry.combination_name = cr2.combination_name; continue; }
    }
  }

  // Confidence
  let score = 0;
  if (entry.beam_name) score += 20;
  if (entry.series_code) score += 25;
  if (entry.combination_name) score += 10;
  if (entry.colors.length > 0) score += 25;
  if (entry.stock !== null) score += 20;
  entry.confidence = score;

  if (!entry.beam_name) entry.parseErrors.push('Beam name not found');
  if (!entry.series_code) entry.parseErrors.push('Series code not found');
  if (entry.colors.length === 0) entry.parseErrors.push('No F-colors found');
  if (entry.stock === null) entry.parseErrors.push('Stock quantity not found');

  return entry;
};

module.exports = { parse };
