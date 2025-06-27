-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    active BOOLEAN,
    name TEXT,
    description TEXT,
    image TEXT,
    metadata JSONB
);

-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id),
    active BOOLEAN,
    description TEXT,
    unit_amount BIGINT,
    currency TEXT,
    type TEXT,
    interval TEXT,
    interval_count INT,
    trial_period_days INT,
    metadata JSONB
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT,
    metadata JSONB,
    price_id TEXT REFERENCES prices(id),
    quantity INTEGER,
    cancel_at_period_end BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start_at TIMESTAMPTZ,
    trial_end_at TIMESTAMPTZ
);

-- Remove old stripe columns from users table
ALTER TABLE users
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS subscription_plan,
DROP COLUMN IF EXISTS subscription_active; 