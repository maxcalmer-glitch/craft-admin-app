-- CRAFT Admin V3 - Additional tables
-- Run this against your Supabase database

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    target_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast_history (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    photo_url TEXT,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    admin_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_history_created ON broadcast_history(created_at DESC);
