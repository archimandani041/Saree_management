-- ============================================================
-- Duplicate Detection — Unique Constraints Migration
-- Run in Supabase SQL Editor
-- ============================================================
-- This migration adds:
--   1. UNIQUE constraint on sarees.series_code  (owner-scoped)
--   2. UNIQUE constraint on beams (saree_id, beam_name, owner_id)  (case-insensitive)
--   3. Performance indexes for duplicate checks
-- ============================================================

-- ── 1. Sarees: unique series_code per owner ──────────────────
--
-- series_code is a generated column (series_base || series_letter),
-- so we use a unique index on (owner_id, series_code) instead of
-- an ALTER TABLE ADD CONSTRAINT (which cannot reference generated columns).
--
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_sarees_owner_series_code
  ON sarees (owner_id, series_code);

-- ── 2. Beams: unique beam_name per saree per owner (case-insensitive) ────
--
-- We use lower() so "White Beam" and "white beam" are treated as one.
--
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_beams_saree_beam_name_ci
  ON beams (saree_id, owner_id, lower(beam_name));

-- ── 3. Performance indexes for duplicate-check queries ───────

-- Saree lookup by owner + series_code
CREATE INDEX IF NOT EXISTS
  idx_sarees_owner_series
  ON sarees (owner_id, series_code);

-- Beam lookup by saree + owner
CREATE INDEX IF NOT EXISTS
  idx_beams_saree_owner
  ON beams (saree_id, owner_id);

-- Combination lookup by beam + owner
CREATE INDEX IF NOT EXISTS
  idx_combinations_beam_owner
  ON combinations (beam_id, owner_id);

-- Color lookup by combination
CREATE INDEX IF NOT EXISTS
  idx_combination_colors_combo
  ON combination_colors (combination_id);

-- ── 4. Verify constraints ────────────────────────────────────
-- Run these SELECT statements to confirm the indexes exist:
--
-- SELECT indexname, indexdef
-- FROM   pg_indexes
-- WHERE  tablename IN ('sarees', 'beams', 'combinations', 'combination_colors')
--   AND  indexname LIKE 'uq_%'
-- ORDER  BY tablename, indexname;
