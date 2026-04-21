-- Migration v3: Add password_hash for custom JWT auth (replaces Supabase Auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Remove auth_id column dependency (was Supabase Auth UUID)
-- Keep it nullable for backwards compat: ALTER TABLE users ALTER COLUMN auth_id DROP NOT NULL;
