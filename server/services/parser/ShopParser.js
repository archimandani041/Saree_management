/**
 * ShopParser — detects a shop / brand marker line (KP or KPR).
 *
 * In WhatsApp messages the shop is written on its own line as a section header:
 *
 *   KP
 *   KS526F
 *   F-1 Red
 *
 *   KPR
 *   KS526F
 *   F-1 Green
 *
 * A shop line is ONLY the bare word KP/KPR (optionally "Shop: KP"), never a
 * series code — those always contain digits (e.g. "KP450A"), so there is no
 * ambiguity with the "KP" prefix used by KP-shop codes.
 */

const SHOP_PATTERN = /^(?:shop\s*[:\-]?\s*)?(KP|KPR)\s*:?\s*$/i;

const parse = (line) => {
  const m = (line || '').match(SHOP_PATTERN);
  if (!m) return null;
  return { brand: m[1].toUpperCase() };
};

module.exports = { parse };
