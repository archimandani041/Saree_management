/**
 * ColorParser — Extracts F-color rows from a line.
 *
 * Supports unlimited F numbers (F-1, F-2, ... F-99+).
 *
 * Handles multiple separator styles:
 *   F-1 : White
 *   F-1: White
 *   F-1 - White
 *   F1 White
 *   F 1 : White
 *   F-1 :. White
 *
 * Extracts optional company from trailing parentheses:
 *   "Gold Tirupati"           → color: "Gold Tirupati",           company: null
 *   "Purple (Ramdev)"         → color: "Purple",                  company: "Ramdev"
 *   "Wine (2213) (Spon)"      → color: "Wine (2213)",             company: "Spon"
 *   "Radiyas Gold Jari"       → color: "Radiyas Gold Jari",       company: null
 */

// F-number pattern:  F followed by optional separator and digits
const COLOR_PATTERN = /^(F[\s\-\.]*\d+)\s*[:.\-]+\s*(.+)$/i;

// Fallback: "F1 White" without any separator
const COLOR_PATTERN_NOSEP = /^(F[\s\-\.]*\d+)\s+([A-Za-z].+)$/i;

/**
 * Parse a single line for an F-color entry.
 * @param {string} line
 * @returns {{ f_number, color_name, company_name } | null}
 */
const parse = (line) => {
  let m = line.match(COLOR_PATTERN);
  if (!m) m = line.match(COLOR_PATTERN_NOSEP);
  if (!m) return null;

  const rawF = m[1].replace(/[^Ff\d]/g, '');
  const fNum = 'F-' + rawF.replace(/^[Ff]/i, '');
  const { color_name, company_name } = extractColorAndCompany(m[2]);

  return { f_number: fNum, color_name, company_name };
};

/**
 * Given raw color value text (everything after "F-1:"),
 * separate color_name from company_name.
 *
 * Rules:
 *  - Strip leading punctuation (e.g. ". " from "F-3 :. Red")
 *  - If the value ends with (...) group(s), the LAST group is company_name
 *  - Everything before the last (...) group is color_name
 */
const extractColorAndCompany = (raw) => {
  // Strip leading dots/punctuation
  let value = raw.replace(/^[.\s]+/, '').trim();

  // Find the last parenthesized group at the end
  const lastParenMatch = value.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (lastParenMatch) {
    return {
      color_name: lastParenMatch[1].trim(),
      company_name: lastParenMatch[2].trim() || null,
    };
  }

  return { color_name: value, company_name: null };
};

module.exports = { parse, extractColorAndCompany };
