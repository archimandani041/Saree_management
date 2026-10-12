-- ============================================================================
-- Subscriptions Migration
-- Provides persistent storage for tenant subscription plans, billing cycles,
-- and deadline enforcement in Supabase PostgreSQL.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'pro',
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Pro',
    badge VARCHAR(50) DEFAULT 'Pro',
    price VARCHAR(50) DEFAULT '₹249',
    amount NUMERIC DEFAULT 249,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRING_SOON, EXPIRED, CANCELLED, SUSPENDED
    started_at TIMESTAMPTZ DEFAULT now(),
    renew_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    transaction_id VARCHAR(100),
    billing_cycle VARCHAR(50) DEFAULT 'Monthly',
    phone VARCHAR(50),
    notes TEXT DEFAULT '',
    custom_limits JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

-- Index for instant lookup by user_id and plan status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renew_date ON public.subscriptions(renew_date);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own subscription
CREATE POLICY subscriptions_user_read_policy ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- RLS Policy: Service role or Admins can perform all operations
CREATE POLICY subscriptions_admin_all_policy ON public.subscriptions
    FOR ALL
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
