/**
 * SeriesParser — Detects series codes from a line.
 *
 * Supports any alphanumeric prefix (KS, KP, KPR, AB, etc.)
 * followed by digits and an optional trailing letter.
 *
 * Also extracts the combination name from parentheses.
 *
 * Examples:
 *   "KS526F (Urgent Delivery)"  → { series_code: "KS526F", series_base: "KS526", series_letter: "F", combination_name: "Urgent Delivery" }
 *   "KP450A"                    → { series_code: "KP450A", series_base: "KP450", series_letter: "A", combination_name: null }
 *   "KS120D (Stock)"            → { series_code: "KS120D", series_base: "KS120", series_letter: "D", combination_name: "Stock" }
 */

// Pattern:  2+ letters, 3+ digits, optional trailing letter, optional (...) combination name
// Allow some leading/trailing noise but the core must be the code
const SERIES_PATTERN = /^([A-Z]{2,}\d{3,}[A-Z]?)(?:\s*\((.+?)\))?\s*$/i;

// Secondary: embedded in a longer line (e.g. after beam header on same line)
const SERIES_INLINE_PATTERN = /\b([A-Z]{2,}\d{3,}[A-Z]?)\b(?:\s*\(([^)]+)\))?/i;

/**
 * Attempt to extract series code from a cleaned line.
 * @param {string} line
 * @returns {{ series_code, series_base, series_letter, combination_name } | null}
 */
const parse = (line) => {
  // Prefer exact line match first
  let m = line.match(SERIES_PATTERN);
  if (!m) {
    // Try inline extraction
    m = line.match(SERIES_INLINE_PATTERN);
  }
  if (!m) return null;

  const code = m[1].toUpperCase();

  // Split into base + letter
  const letterMatch = code.match(/^([A-Z]+\d+)([A-Z])$/);
  let series_base, series_letter;
  if (letterMatch) {
    series_base = letterMatch[1];
    series_letter = letterMatch[2];
  } else {
    series_base = code;
    series_letter = 'A';
  }

  const combination_name = m[2]?.trim() || null;

  return { series_code: code, series_base, series_letter, combination_name };
};

module.exports = { parse };
