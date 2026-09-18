/**
 * OcrService — screenshot → raw text via Google Gemini vision.
 *
 * Used for WhatsApp SCREENSHOT imports (spec §10). The transcribed text is fed
 * back through the exact same WhatsAppParserEngine pipeline as pasted text, so
 * all downstream parsing, duplicate detection, and DB validation are identical.
 *
 * Design notes:
 *  - No SDK dependency: uses the REST endpoint via global fetch (Node 18+).
 *  - The model is instructed to TRANSCRIBE VERBATIM — never summarise, reorder,
 *    translate, or invent — so accuracy/traceability is preserved.
 *  - WhatsApp metadata (sender names, timestamps, emojis) is left in the text and
 *    stripped later by NoiseFilter, keeping one source of truth for noise removal.
 */

const OCR_MODEL = process.env.GEMINI_OCR_MODEL || 'gemini-2.0-flash';

const TRANSCRIBE_PROMPT = [
  'You are a precise OCR engine for a sari inventory app.',
  'Transcribe ALL text visible in this WhatsApp screenshot EXACTLY as it appears,',
  'line by line, preserving the original line breaks and order.',
  'Include every sari code (e.g. KS526F), beam names, F-numbers (F-1, F-2, ...),',
  'colours, company names, and quantities.',
  'Do NOT summarise, translate, reorder, correct, or invent any text.',
  'If a line is a timestamp, sender name, or emoji, transcribe it as-is.',
  'Output ONLY the raw transcribed text with no commentary or markdown.',
].join(' ');

const isConfigured = () => !!process.env.GEMINI_API_KEY;

/**
 * Transcribe an image buffer to text.
 * @param {Buffer} buffer
 * @param {string} mimeType e.g. "image/png", "image/jpeg"
 * @returns {Promise<string>} transcribed text
 * @throws {Error} with .statusCode when not configured / provider failure
 */
const transcribeImage = async (buffer, mimeType) => {
  if (!isConfigured()) {
    const err = new Error('OCR is not configured. Set GEMINI_API_KEY on the server to enable screenshot import.');
    err.statusCode = 501;
    throw err;
  }
  if (!buffer?.length) {
    const err = new Error('No image data received.');
    err.statusCode = 400;
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${OCR_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = {
    contents: [{
      parts: [
        { text: TRANSCRIBE_PROMPT },
        { inline_data: { mime_type: mimeType || 'image/png', data: buffer.toString('base64') } },
      ],
    }],
    // Deterministic transcription — no creativity.
    generationConfig: { temperature: 0 },
  };

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const err = new Error(`Could not reach the OCR provider: ${e.message}`);
    err.statusCode = 502;
    throw err;
  }

  if (!resp.ok) {
    let detail = '';
    try { detail = (await resp.json())?.error?.message || ''; } catch { /* ignore */ }
    const err = new Error(`OCR provider error (${resp.status})${detail ? ': ' + detail : ''}`);
    err.statusCode = resp.status === 400 || resp.status === 403 ? 502 : 502;
    throw err;
  }

  const data = await resp.json();
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || '')
    .join('\n')
    .trim();

  if (!text) {
    const err = new Error('The OCR provider returned no readable text from the image.');
    err.statusCode = 422;
    throw err;
  }
  return text;
};

module.exports = { transcribeImage, isConfigured };
