-- Seed Initial Admin User
-- This script inserts the initial Admin role and Collaborator.
-- 
-- IMPORTANT: This script does NOT create the auth user with password.
-- To complete the setup, you MUST run the TypeScript seed script:
--   npx tsx scripts/seed-admin.ts
-- 
-- The TypeScript script will:
--   1. Create the auth user 'admin@admin.com' with password 'admin'
--   2. Link the collaborator record to the auth user
--
-- The collaborator is created with user_id = NULL initially, and will be linked when the auth user is created.

DO $$
DECLARE
  admin_role_id UUID;
  table_names TEXT[] := ARRAY['roles', 'collaborators', 'clients', 'tags', 'contracts', 'contract_assignments', 'audit_logs'];
  tname TEXT;
BEGIN
  -- 1. Create Admin Role if not exists
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
  
  IF admin_role_id IS NULL THEN
    INSERT INTO roles (name, is_system_role) VALUES ('Admin', TRUE)
    RETURNING id INTO admin_role_id;
    
    -- Grant all permissions
    FOREACH tname IN ARRAY table_names LOOP
      INSERT INTO role_permissions (role_id, table_name, can_read, can_write, can_delete)
      VALUES (admin_role_id, tname, TRUE, TRUE, TRUE);
    END LOOP;
  END IF;

  -- 2. Create Admin Collaborator (without user_id - will be linked later when auth user is created)
  -- We check if collaborator already exists by email to avoid duplicates
  IF NOT EXISTS (SELECT 1 FROM collaborators WHERE email = 'admin@admin.com') THEN
    INSERT INTO collaborators (user_id, role_id, full_name, email, status)
    VALUES (NULL, admin_role_id, 'System Admin', 'admin@admin.com', 'active');
  END IF;

END $$;
