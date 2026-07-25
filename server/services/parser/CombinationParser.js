/**
 * CombinationParser — Extracts combination name from parentheses.
 *
 * This is a secondary parser used when the combination name
 * was not found on the series line.
 *
 * Examples:
 *   "(Urgent Delivery)" → "Urgent Delivery"
 *   "(Stock)"           → "Stock"
 *   "(Aje Delivery)"    → "Aje Delivery"
 */

// Standalone parenthesized line
const COMBO_NAME_PATTERN = /^\s*\((.+?)\)\s*$/;

/**
 * Check if a line is a standalone combination name in parentheses.
 * @param {string} line
 * @returns {{ combination_name: string } | null}
 */
const parse = (line) => {
  const m = line.match(COMBO_NAME_PATTERN);
  if (!m) return null;
  return { combination_name: m[1].trim() };
};

module.exports = { parse };
