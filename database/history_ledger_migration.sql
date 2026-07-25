-- ============================================================
-- Complete History & Inventory Audit Ledger Migration
-- ============================================================

-- 1. Create action enum / check constraint if needed or extend stock_history table
-- Expand stock_history table to store structured metadata for all 20 action types.

ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS machine_name VARCHAR(100);
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';
ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Indexes for 100,000+ records high-performance auditing
CREATE INDEX IF NOT EXISTS idx_stock_history_owner_date ON stock_history(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_saree ON stock_history(saree_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_combo ON stock_history(combination_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_action_type ON stock_history(action_type);
CREATE INDEX IF NOT EXISTS idx_stock_history_machine ON stock_history(machine_name);
CREATE INDEX IF NOT EXISTS idx_stock_history_invoice ON stock_history(invoice_number);
