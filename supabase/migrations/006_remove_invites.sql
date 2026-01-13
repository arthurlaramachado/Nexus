-- Remove invite related functions and triggers
DROP FUNCTION IF EXISTS accept_invite(TEXT, UUID) CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Remove invite related columns from collaborators
ALTER TABLE collaborators DROP COLUMN IF EXISTS invite_token;
ALTER TABLE collaborators DROP COLUMN IF EXISTS expires_at;

-- Remove invite related index (if not automatically dropped with column)
DROP INDEX IF EXISTS idx_collab_invite_token;

-- Remove invite related policy
DROP POLICY IF EXISTS "Allow invited collaborators to be read by invite token" ON collaborators;

-- Update employment_status enum to remove 'invited'
-- This requires creating a new type, updating the column, and dropping the old type
ALTER TYPE employment_status RENAME TO employment_status_old;
CREATE TYPE employment_status AS ENUM ('active', 'inactive');

-- Update the column to use the new type
-- We map 'invited' to 'inactive' or handle it as needed. Assuming we want to keep them as inactive or they should be deleted manually before.
-- Let's assume we map 'invited' to 'inactive' for safety.
ALTER TABLE collaborators 
  ALTER COLUMN status TYPE employment_status 
  USING (
    CASE status::text 
      WHEN 'invited' THEN 'inactive'::employment_status 
      ELSE status::text::employment_status 
    END
  );

DROP TYPE employment_status_old;
