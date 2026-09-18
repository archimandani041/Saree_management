-- ============================================================================
-- SHOP (KP / KPR) ISOLATION MIGRATION
-- ----------------------------------------------------------------------------
-- Makes "shop" (the `brand` column: KP or KPR) part of a sari's identity so the
-- SAME series code can exist independently in each shop and the two inventories
-- can never collide.
--
-- Identity becomes:  owner_id + brand + series_base + series_letter
--                    (i.e. owner + shop + series_code)
--
-- Safe to run multiple times (idempotent). Run this in the Supabase SQL editor.
-- ============================================================================

-- 1. Ensure the shop column exists on sarees, is constrained to KP/KPR, and is
--    NEVER null (default KP so existing rows remain valid).
ALTER TABLE sarees ADD COLUMN IF NOT EXISTS brand VARCHAR(50) DEFAULT 'KP';
UPDATE sarees SET brand = 'KP' WHERE brand IS NULL OR TRIM(brand) = '';
ALTER TABLE sarees ALTER COLUMN brand SET DEFAULT 'KP';
ALTER TABLE sarees ALTER COLUMN brand SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sarees_brand_check'
  ) THEN
    ALTER TABLE sarees ADD CONSTRAINT sarees_brand_check CHECK (brand IN ('KP', 'KPR'));
  END IF;
END$$;

-- 2. Ensure combinations also carry a shop that mirrors their parent sari.
ALTER TABLE combinations ADD COLUMN IF NOT EXISTS brand VARCHAR(50) DEFAULT 'KP';

-- Backfill every combination's shop from its parent sari so they are consistent.
UPDATE combinations c
SET brand = s.brand
FROM beams b
JOIN sarees s ON s.id = b.saree_id
WHERE c.beam_id = b.id
  AND (c.brand IS DISTINCT FROM s.brand);

UPDATE combinations SET brand = 'KP' WHERE brand IS NULL OR TRIM(brand) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'combinations_brand_check'
  ) THEN
    ALTER TABLE combinations ADD CONSTRAINT combinations_brand_check CHECK (brand IN ('KP', 'KPR'));
  END IF;
END$$;

-- 3. Drop every prior sarees-uniqueness rule so the same code isn't blocked
--    across shops. (Covers all the historical migrations in this repo.)
ALTER TABLE sarees DROP CONSTRAINT IF EXISTS sarees_series_base_series_letter_key;  -- original global
ALTER TABLE sarees DROP CONSTRAINT IF EXISTS sarees_series_owner_unique;            -- owner-scoped
ALTER TABLE sarees DROP CONSTRAINT IF EXISTS sarees_series_code_key;                -- global series_code
DROP INDEX IF EXISTS sarees_series_code_owner_uidx;                                 -- from duplicate_detection_constraints.sql

-- 4. The new identity: unique per owner + shop + series.
ALTER TABLE sarees
  ADD CONSTRAINT sarees_series_owner_brand_unique
  UNIQUE (series_base, series_letter, owner_id, brand);

-- 5. Helpful indexes for shop-scoped lookups.
CREATE INDEX IF NOT EXISTS idx_sarees_brand ON sarees(brand);
CREATE INDEX IF NOT EXISTS idx_sarees_owner_brand ON sarees(owner_id, brand);
CREATE INDEX IF NOT EXISTS idx_combinations_brand ON combinations(brand);

-- ============================================================================
-- VERIFY (optional):
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'sarees'::regclass AND contype = 'u';
-- Expect: sarees_series_owner_brand_unique UNIQUE (series_base, series_letter, owner_id, brand)
-- ============================================================================
