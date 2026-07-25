/**
 * BlockSplitter — Splits cleaned lines into logical blocks.
 *
 * Each block represents one saree entry (beam → series → colors → stock).
 *
 * The splitter uses multiple strategies:
 *   1. Primary: Split on Beam headers (e.g. "White Beam:")
 *   2. Secondary: Split on Series codes when beam is missing
 *   3. Fallback: Treat entire input as one block
 *
 * This "AI-like" approach doesn't depend on fixed line order.
 * It identifies structural boundaries regardless of field ordering.
 */

const BeamParser = require('./BeamParser');
const SeriesParser = require('./SeriesParser');

/**
 * Check if a line is a block boundary (beam header or series code).
 * Returns the boundary type.
 * @param {string} line
 * @returns {'beam' | 'series' | null}
 */
const getBoundaryType = (line) => {
  if (BeamParser.parse(line)) return 'beam';
  if (SeriesParser.parse(line)) return 'series';
  return null;
};

/**
 * Split cleaned lines into blocks.
 * Uses an adaptive strategy:
 *   - If beam headers are found, split on them.
 *   - Otherwise, split on series codes.
 *   - If neither is found, treat as one block.
 *
 * @param {string[]} lines — cleaned, noise-free lines
 * @returns {string[][]} — array of blocks (each block is an array of lines)
 */
const split = (lines) => {
  if (lines.length === 0) return [];

  // Scan for boundaries
  const boundaries = [];
  lines.forEach((line, i) => {
    const type = getBoundaryType(line);
    if (type) boundaries.push({ index: i, type, line });
  });

  // Strategy 1: Beam-based splitting (preferred)
  const beamBoundaries = boundaries.filter((b) => b.type === 'beam');
  if (beamBoundaries.length > 0) {
    return splitAtIndices(
      lines,
      beamBoundaries.map((b) => b.index)
    );
  }

  // Strategy 2: Series-based splitting
  const seriesBoundaries = boundaries.filter((b) => b.type === 'series');
  if (seriesBoundaries.length > 1) {
    return splitAtIndices(
      lines,
      seriesBoundaries.map((b) => b.index)
    );
  }

  // Strategy 3: Single block
  return [lines];
};

/**
 * Split lines at the given indices, where each index starts a new block.
 * Lines before the first boundary go into the first block (or are prepended to it).
 * @param {string[]} lines
 * @param {number[]} indices — sorted indices where new blocks start
 * @returns {string[][]}
 */
const splitAtIndices = (lines, indices) => {
  const blocks = [];

  // If there are lines before the first boundary, include them in the first block
  const sortedIndices = [...new Set(indices)].sort((a, b) => a - b);

  for (let i = 0; i < sortedIndices.length; i++) {
    const start = i === 0 ? 0 : sortedIndices[i];
    const end = i + 1 < sortedIndices.length ? sortedIndices[i + 1] : lines.length;

    // For the first block, include any orphan lines before the first boundary
    if (i === 0 && sortedIndices[0] > 0) {
      blocks.push(lines.slice(0, end));
    } else {
      blocks.push(lines.slice(start, end));
    }
  }

  return blocks.filter((b) => b.length > 0);
};

module.exports = { split, getBoundaryType };
