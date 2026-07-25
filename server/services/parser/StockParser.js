/**
 * StockParser — Extracts stock quantity from a line.
 *
 * Supports:
 *   99 pcs
 *   99 PCS
 *   99 Pcs
 *   99 Pieces
 *   99 Piece
 *   99 pcs/-
 *   99 Pcs /-
 *   99
 *   300
 *
 * Returns only the numeric value as an integer.
 * Also detects relative stock: +50, -30
 */

// Primary: number followed by pcs/pieces keyword (with optional "/-" suffix)
const STOCK_EXACT = /^(\d+)\s*(?:pcs|pieces?|pc|nos)\s*(?:\/\s*-?|-\s*\/?)?\.?\s*$/i;

// Fallback: standalone number (2-5 digits) on its own line — likely stock
const STOCK_BARE = /^(\d{2,5})\s*$/;

// Relative: +50, -30 (with optional pcs)
const STOCK_RELATIVE = /^([+-])\s*(\d+)\s*(?:pcs|pieces?|pc|nos)?\s*(?:\/\s*-?|-\s*\/?)?\.?\s*$/i;

// Inline: "50 pcs" embedded in a longer line
const STOCK_INLINE = /(\d+)\s*(?:pcs|pieces?|pc|nos)\b/i;

/**
 * Parse a line for stock quantity.
 * @param {string} line
 * @returns {{ stock: number, isRelative: boolean, relativeSign: number } | null}
 */
const parse = (line) => {
  // 1. Relative stock
  let m = line.match(STOCK_RELATIVE);
  if (m) {
    return {
      stock: parseInt(m[2], 10),
      isRelative: true,
      relativeSign: m[1] === '-' ? -1 : 1,
    };
  }

  // 2. Exact match (number + pcs)
  m = line.match(STOCK_EXACT);
  if (m) {
    return { stock: parseInt(m[1], 10), isRelative: false, relativeSign: 1 };
  }

  // 3. Bare number (standalone)
  m = line.match(STOCK_BARE);
  if (m) {
    return { stock: parseInt(m[1], 10), isRelative: false, relativeSign: 1 };
  }

  // 4. Inline fallback
  m = line.match(STOCK_INLINE);
  if (m) {
    return { stock: parseInt(m[1], 10), isRelative: false, relativeSign: 1 };
  }

  return null;
};

module.exports = { parse };
