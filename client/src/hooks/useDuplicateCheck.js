/**
 * useDuplicateCheck — React hook for inline duplicate validation.
 *
 * Provides debounced checks for saree-level, beam-level, and
 * combination-level duplicates. Designed to be used inside forms.
 *
 * Usage:
 *   const { checkSareeCode, checkBeamName, checkCombination } = useDuplicateCheck();
 */
import { useCallback, useRef } from 'react';
import { duplicateAPI } from '../services/api';

const DEBOUNCE_MS = 450;

const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(fn(...args)), ms);
    });
  };
};

export const useDuplicateCheck = () => {
  const sareeTimer = useRef(null);
  const beamTimer  = useRef(null);

  /**
   * Check if a series_code already exists.
   * @param {string} seriesCode
   * @param {string|null} excludeId  – current saree id when editing
   * @returns {Promise<{ isDuplicate: boolean, existingId?, existingCode? }>}
   */
  const checkSareeCode = useCallback((seriesCode, excludeId = null) => {
    clearTimeout(sareeTimer.current);
    return new Promise((resolve) => {
      sareeTimer.current = setTimeout(async () => {
        if (!seriesCode?.trim()) return resolve({ isDuplicate: false });
        try {
          const { data } = await duplicateAPI.checkSaree({ series_code: seriesCode, exclude_id: excludeId });
          resolve(data);
        } catch {
          resolve({ isDuplicate: false });
        }
      }, DEBOUNCE_MS);
    });
  }, []);

  /**
   * Check if a beam name already exists within a saree.
   * @param {string} sareeId
   * @param {string} beamName
   * @param {string|null} excludeBeamId
   */
  const checkBeamName = useCallback((sareeId, beamName, excludeBeamId = null) => {
    clearTimeout(beamTimer.current);
    return new Promise((resolve) => {
      beamTimer.current = setTimeout(async () => {
        if (!sareeId || !beamName?.trim()) return resolve({ isDuplicate: false });
        try {
          const { data } = await duplicateAPI.checkBeam({ saree_id: sareeId, beam_name: beamName, exclude_beam_id: excludeBeamId });
          resolve(data);
        } catch {
          resolve({ isDuplicate: false });
        }
      }, DEBOUNCE_MS);
    });
  }, []);

  /**
   * Check combination similarity within a beam.
   * @param {string} beamId
   * @param {{ combination_name, colors, image_url }} combo
   * @param {string|null} excludeComboId
   * @returns {Promise<{ status: 'NEW'|'SIMILAR'|'DUPLICATE'|'IMAGE_CONFLICT', score, existingCombo, diff }>}
   */
  const checkCombinationSimilarity = useCallback(async (beamId, combo, excludeComboId = null) => {
    if (!beamId) return { status: 'NEW', score: 0 };
    try {
      const { data } = await duplicateAPI.checkCombination({
        beam_id: beamId,
        combination_name: combo.combination_name,
        colors: combo.colors || [],
        image_url: combo.image_url || null,
        exclude_combo_id: excludeComboId,
      });
      return data;
    } catch {
      return { status: 'NEW', score: 0 };
    }
  }, []);

  /**
   * Run batch duplicate check on WhatsApp-parsed entries.
   * @param {Array} entries
   * @returns {Promise<Array<{ entry, status, score, existingCombo, diff }>>}
   */
  const checkWhatsAppBatch = useCallback(async (entries) => {
    if (!entries?.length) return [];
    try {
      const { data } = await duplicateAPI.checkWhatsAppBatch({ entries });
      return data.results || [];
    } catch {
      return entries.map((entry) => ({ entry, status: 'NEW', score: 0 }));
    }
  }, []);

  return { checkSareeCode, checkBeamName, checkCombinationSimilarity, checkWhatsAppBatch };
};
