/**
 * BeamParser — Detects beam names from a line.
 *
 * Supports any beam name (e.g. "White Beam:", "BLACK Beam", "Red Beam").
 * Case-insensitive.  Returns normalized Title Case.
 */

// Common beam pattern:  <anything> beam  (with optional trailing colon)
const BEAM_PATTERN = /^(.+?\bbeam)\b\s*:?\s*$/i;

/**
 * Attempt to extract a beam name from a single cleaned line.
 * @param {string} line  — cleaned, trimmed line
 * @returns {{ beam_name: string } | null}
 */
const parse = (line) => {
  const m = line.match(BEAM_PATTERN);
  if (!m) return null;
  return { beam_name: normalize(m[1]) };
};

/**
 * Normalize a beam name to consistent Title Case.
 * "BLACK beam" → "Black Beam", "red BEAM" → "Red Beam"
 */
const normalize = (name) => {
  if (!name) return name;
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

module.exports = { parse, normalize };
