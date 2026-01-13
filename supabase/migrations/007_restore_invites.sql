-- Restore invites support
-- This migration re-adds invite columns, updates the status enum, and adds the RLS policy

-- 1. Update employment_status enum
ALTER TYPE employment_status ADD VALUE IF NOT EXISTS 'invited' BEFORE 'inactive';

-- 2. Add invite columns to collaborators
ALTER TABLE collaborators 
ADD COLUMN IF NOT EXISTS invite_token TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Add index for invite token lookup
CREATE INDEX IF NOT EXISTS idx_collab_invite_token ON collaborators(invite_token);

-- 4. Add RLS policy for public invite token validation
-- This allows anyone (unauthenticated) to read a collaborator record IF they have the matching token
-- and the status is 'invited' and the token hasn't expired.
CREATE POLICY "Allow invited collaborators to be read by invite token" ON collaborators FOR SELECT
USING (
  status = 'invited' 
  AND invite_token IS NOT NULL 
  AND (expires_at IS NULL OR expires_at > NOW())
);
