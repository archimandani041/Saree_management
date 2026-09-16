/**
 * BlockParser — Parses a single block of lines into a structured entry.
 *
 * Order-independent AND format-independent: every line is probed for a beam
 * header, a series code, one or more F-colors, and a stock quantity. Crucially,
 * a single compact line such as "KS526F - F-1 Red" or "KS526F — F-1 — Red 10 pcs"
 * is decomposed into ALL of its fields instead of stopping at the first match —
 * so no colour or quantity is silently lost.
 *
 * Traceability guarantees (see product spec):
 *   - raw_text          the exact source lines for this entry
 *   - missing_fields    fields that could not be confidently extracted
 *   - color_warnings    duplicate F-numbers detected inside one combination
 */

const BeamParser = require('./BeamParser');
const SeriesParser = require('./SeriesParser');
const CombinationParser = require('./CombinationParser');
const ColorParser = require('./ColorParser');
const StockParser = require('./StockParser');

// Trailing stock on a compact colour line: "... - 10", "... : 10 pcs"
const TRAIL_STOCK_SEP = /\s*[-:]\s*(\d{1,5})\s*(?:pcs|pieces?|pc|nos)?\.?\s*$/i;
// Trailing stock with an explicit unit keyword: "... 10 pcs"
const TRAIL_STOCK_KW = /\s+(\d{1,5})\s*(?:pcs|pieces?|pc|nos)\.?\s*$/i;

// Remove the first literal occurrence of `sub` from `line` (regex-safe).
const stripFirst = (line, sub) => {
  const i = line.indexOf(sub);
  if (i === -1) return line;
  return `${line.slice(0, i)} ${line.slice(i + sub.length)}`;
};

// Strip leading separators/punctuation left over after removing the series code.
const stripLeadSeparators = (line) => line.replace(/^[\s\-:.,|>]+/, '').trim();

/**
 * Attempt to peel a trailing stock quantity off a compact colour line.
 * Conservative: only fires when there is an explicit separator or a unit keyword,
 * so colour codes like "Wine (2213)" are never mistaken for stock.
 * @returns {{ stock, isRelative, relativeSign, rest } | null}
 */
const peelTrailingStock = (line) => {
  let m = line.match(TRAIL_STOCK_SEP);
  if (!m) m = line.match(TRAIL_STOCK_KW);
  if (!m) return null;
  const rest = line.slice(0, m.index).trim();
  // Require the remainder to still hold a colour name (letters), else it was noise.
  if (!/[A-Za-z]/.test(rest)) return null;
  return { stock: parseInt(m[1], 10), isRelative: false, relativeSign: 1, rest };
};

// Add a colour to the entry, flagging duplicate F-numbers within this combination.
const pushColor = (entry, seenF, cr) => {
  const key = (cr.f_number || '').toUpperCase();
  if (seenF.has(key)) {
    const prev = seenF.get(key);
    entry.color_warnings.push({
      f_number: cr.f_number,
      color_name: cr.color_name,
      duplicateOfColor: prev,
      sameColor: (prev || '').trim().toLowerCase() === (cr.color_name || '').trim().toLowerCase(),
    });
  }
  seenF.set(key, cr.color_name || '');
  entry.colors.push(cr);
};

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
    missing_fields: [],
    color_warnings: [],
    raw_text: lines.join('\n'),
    _rawLines: lines,
  };

  const seenF = new Map(); // F-number -> colour name, for in-combination duplicate detection

  for (const rawLine of lines) {
    let line = rawLine;

    // 1. Beam header ("White Beam:")
    if (!entry.beam_name) {
      const r = BeamParser.parse(line);
      if (r) { entry.beam_name = r.beam_name; continue; }
    }

    // 2. Series code — strip it out so the remainder of a compact line keeps parsing.
    if (!entry.series_code) {
      const r = SeriesParser.parse(line);
      if (r) {
        entry.series_code = r.series_code;
        entry.series_base = r.series_base;
        entry.series_letter = r.series_letter;
        if (r.combination_name) entry.combination_name = r.combination_name;
        line = stripLeadSeparators(stripFirst(line, r.matchedText));
        if (!line) continue; // whole line was just the code
        // otherwise fall through: the rest of this line may hold a colour/stock
      }
    }

    // 3. On a compact colour line, peel any trailing quantity ("F-1 Red 10 pcs").
    if (/^F[\s\-.]*\d/i.test(line)) {
      const peeled = peelTrailingStock(line);
      if (peeled) {
        if (entry.stock === null) {
          entry.stock = peeled.stock;
          entry.isRelative = peeled.isRelative;
          entry.relativeSign = peeled.relativeSign;
        }
        line = peeled.rest;
      }
    }

    // 4. F-colour (anchored at the start of the remaining text)
    const cr = ColorParser.parse(line);
    if (cr) { pushColor(entry, seenF, cr); continue; }

    // 5. Stock on its own line ("99 pcs", "300", "+50")
    if (entry.stock === null) {
      const sr = StockParser.parse(line);
      if (sr) {
        entry.stock = sr.stock;
        entry.isRelative = sr.isRelative;
        entry.relativeSign = sr.relativeSign;
        continue;
      }
    }

    // 6. Standalone combination name in parentheses ("(Aje Delivery)")
    if (!entry.combination_name) {
      const cr2 = CombinationParser.parse(line);
      if (cr2) { entry.combination_name = cr2.combination_name; continue; }
    }
  }

  // ── Confidence score (0–100) ──────────────────────────────────────────────
  let score = 0;
  if (entry.beam_name) score += 20;
  if (entry.series_code) score += 25;
  if (entry.combination_name) score += 10;
  if (entry.colors.length > 0) score += 25;
  if (entry.stock !== null) score += 20;
  entry.confidence = score;

  // ── Missing-field tracking (never assume a value; surface uncertainty) ─────
  if (!entry.series_code) entry.missing_fields.push('series_code');
  if (entry.colors.length === 0) entry.missing_fields.push('colors');
  if (entry.stock === null) entry.missing_fields.push('stock');
  if (!entry.beam_name) entry.missing_fields.push('beam');

  // Legacy human-readable messages (kept for backward compatibility)
  if (!entry.beam_name) entry.parseErrors.push('Beam name not found');
  if (!entry.series_code) entry.parseErrors.push('Series code not found');
  if (entry.colors.length === 0) entry.parseErrors.push('No F-colors found');
  if (entry.stock === null) entry.parseErrors.push('Stock quantity not found');
  entry.color_warnings.forEach((w) => {
    entry.parseErrors.push(
      `Duplicate ${w.f_number} in this combination (${w.sameColor ? 'same colour repeated' : `also seen as "${w.duplicateOfColor}"`})`
    );
  });

  return entry;
};

module.exports = { parse };
