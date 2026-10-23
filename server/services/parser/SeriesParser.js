/**
 * SeriesParser — Detects series codes from a line.
 *
 * Supports any alphanumeric prefix (KS, KP, KPR, AB, etc.)
 * followed by digits and an optional trailing letter.
 *
 * When fetching saree from a message, considers code like KS123,
 * ignoring the last alphabetical character (e.g., KS1020B -> KS1020).
 *
 * Also extracts the combination name from parentheses.
 *
 * Examples:
 *   "KS526F (Urgent Delivery)"  → { series_code: "KS526", series_base: "KS526", series_letter: "F", raw_code: "KS526F", combination_name: "Urgent Delivery" }
 *   "KP450A"                    → { series_code: "KP450", series_base: "KP450", series_letter: "A", raw_code: "KP450A", combination_name: null }
 *   "KS120D (Stock)"            → { series_code: "KS120", series_base: "KS120", series_letter: "D", raw_code: "KS120D", combination_name: "Stock" }
 *   "KS491 (Delivery)"          → { series_code: "KS491", series_base: "KS491", series_letter: "A", raw_code: "KS491", combination_name: "Delivery" }
 */

// Pattern:  2+ letters, 1+ digits, optional trailing letter, optional (...) combination name
// Allow some leading/trailing noise but the core must be the code
const SERIES_PATTERN = /^([A-Z]{2,}\d+[A-Z]?)(?:\s*\((.+?)\))?\s*$/i;

// Secondary: embedded in a longer line (e.g. after beam header on same line)
const SERIES_INLINE_PATTERN = /\b([A-Z]{2,}\d+[A-Z]?)\b(?:\s*\(([^)]+)\))?/i;

/**
 * Attempt to extract series code from a cleaned line.
 * @param {string} line
 * @returns {{ series_code, series_base, series_letter, raw_code, combination_name, matchedText } | null}
 */
const parse = (line) => {
  // Prefer exact line match first
  let m = line.match(SERIES_PATTERN);
  if (!m) {
    // Try inline extraction
    m = line.match(SERIES_INLINE_PATTERN);
  }
  if (!m) return null;

  const rawCode = m[1].toUpperCase();

  // Split into base + letter
  // If code ends in an alphabetical character after digits (e.g. KS1020B, KS425C, KP1020H),
  // ignore that last alphabetical character for series_code so it is considered like KS123.
  const letterMatch = rawCode.match(/^([A-Z]+\d+)([A-Z])$/);
  let series_base, series_letter;
  if (letterMatch) {
    series_base = letterMatch[1];
    series_letter = letterMatch[2];
  } else {
    series_base = rawCode;
    series_letter = 'A';
  }

  // Saree code is considered like KS123 (ignoring trailing alphabetical character)
  const series_code = series_base;
  const combination_name = m[2]?.trim() || null;

  // matchedText is the exact substring consumed from the line (code + optional
  // "(combination)"), so callers can strip it and keep parsing the remainder of
  // a compact single-line entry like "KS526F - F-1 Red".
  return { series_code, series_base, series_letter, raw_code: rawCode, combination_name, matchedText: m[0] };
};

module.exports = { parse };
