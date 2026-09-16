/**
 * NoiseFilter — Filters out WhatsApp noise lines and cleans text.
 *
 * Ignores:
 *   - Timestamps (11:20 AM, 12:34 pm)
 *   - Dates (12/03/2024, 2024-01-15)
 *   - Phone numbers (+91 98765 43210)
 *   - Contact names (from WhatsApp headers like "Ruchik Godakiya")
 *   - "Forwarded", "Today", "Yesterday"
 *   - Read receipts
 *   - Emojis
 *   - Hyphen separators (------)
 *   - Empty lines
 *   - "This message was deleted"
 *   - WhatsApp chat header lines
 */

const NOISE_PATTERNS = [
  /^\d{1,2}:\d{2}\s*(am|pm)?$/i,                // timestamps: 12:34 AM
  /^\d{1,2}[/:]\d{2}\s*(am|pm)\s*$/i,            // timestamps with slash
  /^\d{1,2}\/\d{1,2}\/\d{2,4}/,                  // dates: 12/03/2024
  /^\d{4}-\d{2}-\d{2}/,                           // ISO dates: 2024-01-15
  /^\+?\d[\d\s\-]{8,}/,                           // phone numbers
  /^forwarded$/i,                                  // "Forwarded"
  /^today$/i,                                      // "Today"
  /^yesterday$/i,                                  // "Yesterday"
  /^read$/i,                                       // "Read"
  /^delivered$/i,                                   // "Delivered"
  /^sent$/i,                                        // "Sent"
  /^this message was deleted$/i,                    // Deleted messages
  /^you deleted this message$/i,                    // Self-deleted
  /^messages? and calls are end-to-end encrypted/i, // WhatsApp header
  /^[-=_]{3,}$/,                                   // Hyphen/equals separators
  /^\[?\d{1,2}[/:]\d{2}[/:]\d{2,4},?\s+\d{1,2}:\d{2}/,  // WhatsApp timestamp header
  /^~.*$/,                                          // WhatsApp tilde prefix contact
];

// Known contact name patterns (simple heuristic: single capitalized word pairs with no F-color, beam, or series)
const CONTACT_PATTERN = /^[A-Z][a-z]+ [A-Z][a-z]+$/;

// Additional check: person-name lines that are exactly 2 words and contain no numbers
const isProbableContactName = (line) => {
  if (!CONTACT_PATTERN.test(line)) return false;
  // Exclude if it matches beam or series or color patterns
  if (/beam/i.test(line)) return false;
  if (/^[A-Z]{2,}\d/i.test(line)) return false;
  if (/^F[\s\-\.]*\d/i.test(line)) return false;
  return true;
};

/**
 * Check if a line is noise (should be skipped).
 * @param {string} line — cleaned line
 * @returns {boolean}
 */
const isNoise = (line) => {
  if (!line || line.trim().length === 0) return true;
  if (NOISE_PATTERNS.some((p) => p.test(line))) return true;
  if (isProbableContactName(line)) return true;
  return false;
};

/**
 * Clean a raw line: strip emojis, extra whitespace, normalize.
 * @param {string} line
 * @returns {string}
 */
const cleanLine = (line) => {
  return line
    .replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ''
    )
    // Normalize unicode dashes (en-dash, em-dash, minus sign, etc.) to a plain hyphen
    // so separators like "KS526F — F-1 — Red" parse identically to "KS526F - F-1 - Red".
    .replace(/[‒–—―−]/g, '-')
    // Normalize fancy bullets/asterisks used for *bold* wrapping into spaces
    .replace(/[*•·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Process raw message text into an array of cleaned, non-noise lines.
 * @param {string} rawText
 * @returns {string[]}
 */
const filterLines = (rawText) => {
  return rawText
    .split('\n')
    .map(cleanLine)
    .filter((l) => l.length > 0)
    .filter((l) => !isNoise(l));
};

module.exports = { isNoise, cleanLine, filterLines };
