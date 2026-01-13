-- =====================================================
-- REMOVE ORGANIZATIONS SYSTEM
-- =====================================================
-- This migration removes the entire organizations concept
-- All data becomes global, filtered only by role permissions

-- 1. Drop triggers that reference organization_invites
DROP TRIGGER IF EXISTS audit_invites ON organization_invites;

-- 2. Drop tables
DROP TABLE IF EXISTS organization_invites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 3. Drop functions that use organization_id
DROP FUNCTION IF EXISTS is_org_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS accept_invite(TEXT, UUID) CASCADE;

-- 4. Remove organization_id column from all tables
ALTER TABLE roles DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE collaborators DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE clients DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE tags DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE client_tags DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE contracts DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE contract_assignments DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS organization_id CASCADE;

-- 5. Remove unique constraints that include organization_id
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_organization_id_name_key;
ALTER TABLE collaborators DROP CONSTRAINT IF EXISTS collaborators_organization_id_user_id_key;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_organization_id_unique_identifier_key;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_organization_id_name_key;

-- 6. Drop indexes related to organization_id
DROP INDEX IF EXISTS idx_collab_org_user;
DROP INDEX IF EXISTS idx_clients_org;
DROP INDEX IF EXISTS idx_contracts_org;
DROP INDEX IF EXISTS idx_tags_org;
DROP INDEX IF EXISTS idx_client_tags_org;
DROP INDEX IF EXISTS idx_invites_org;

-- 7. Add expires_at to collaborators for invite expiration
ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 8. Update has_permission function to remove org_id parameter
CREATE OR REPLACE FUNCTION has_permission(target_table_name TEXT, permission_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_id UUID;
  user_is_system_role BOOLEAN;
BEGIN
  -- Get user's role and system status
  SELECT r.id, r.is_system_role INTO user_role_id, user_is_system_role
  FROM collaborators c
  JOIN roles r ON c.role_id = r.id
  WHERE c.user_id = auth.uid()
  AND c.status = 'active'
  LIMIT 1;

  IF user_role_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- System roles have all permissions
  IF user_is_system_role THEN
    RETURN TRUE;
  END IF;

  -- Check role permissions
  IF permission_type = 'read' THEN
    RETURN EXISTS (
      SELECT 1 FROM role_permissions
      WHERE role_id = user_role_id
      AND table_name = target_table_name
      AND can_read = TRUE
    );
  ELSIF permission_type = 'write' THEN
    RETURN EXISTS (
      SELECT 1 FROM role_permissions
      WHERE role_id = user_role_id
      AND table_name = target_table_name
      AND can_write = TRUE
    );
  ELSIF permission_type = 'delete' THEN
    RETURN EXISTS (
      SELECT 1 FROM role_permissions
      WHERE role_id = user_role_id
      AND table_name = target_table_name
      AND can_delete = TRUE
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 9. Update handle_new_user trigger to not create organization
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_role_id UUID;
  user_name TEXT;
  user_email TEXT;
  table_names TEXT[] := ARRAY['roles', 'collaborators', 'clients', 'tags', 'contracts', 'contract_assignments', 'audit_logs'];
  tname TEXT;
  has_pending_invite BOOLEAN;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));

  -- Check if user has a pending invite (signup via invite)
  SELECT EXISTS(
    SELECT 1 FROM collaborators 
    WHERE email = user_email 
    AND status = 'invited'
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_pending_invite;

  -- Only create role and collaborator if user doesn't have a pending invite
  -- If they have an invite, accept_invite() will handle linking them
  IF NOT has_pending_invite THEN
    -- Create Admin role (global, no organization)
    INSERT INTO roles (name, is_system_role)
    VALUES ('Admin', TRUE)
    RETURNING id INTO new_role_id;

    -- Grant all permissions to Admin role
    FOREACH tname IN ARRAY table_names LOOP
      INSERT INTO role_permissions (role_id, table_name, can_read, can_write, can_delete)
      VALUES (new_role_id, tname, TRUE, TRUE, TRUE);
    END LOOP;

    -- Create collaborator with Admin role
    INSERT INTO collaborators (user_id, role_id, full_name, email, status)
    VALUES (NEW.id, new_role_id, user_name, user_email, 'active');
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Signup Trigger Failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 10. Create simplified accept_invite function
CREATE OR REPLACE FUNCTION accept_invite(invite_token_param TEXT, user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  invited_collaborator_id UUID;
  invited_role_id UUID;
  existing_collaborator_id UUID;
BEGIN
  -- Find collaborator with invite token
  SELECT id, role_id INTO invited_collaborator_id, invited_role_id
  FROM collaborators
  WHERE invite_token = invite_token_param
  AND status = 'invited'
  AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Check if user already has a collaborator record
  SELECT id INTO existing_collaborator_id
  FROM collaborators
  WHERE user_id = user_id_param
  AND status = 'active';

  IF existing_collaborator_id IS NOT NULL THEN
    -- User already has a collaborator - update it with the invited role
    UPDATE collaborators
    SET role_id = invited_role_id,
        status = 'active'
    WHERE id = existing_collaborator_id;
    
    -- Delete the invited collaborator record (it was just a placeholder)
    DELETE FROM collaborators WHERE id = invited_collaborator_id;
  ELSE
    -- User doesn't have a collaborator - update the invited one
    UPDATE collaborators
    SET user_id = user_id_param,
        status = 'active',
        invite_token = NULL,
        expires_at = NULL
    WHERE id = invited_collaborator_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Drop all RLS policies that reference organizations
DROP POLICY IF EXISTS "Members view orgs" ON organizations;
DROP POLICY IF EXISTS "Service role insert orgs" ON organizations;
DROP POLICY IF EXISTS "Members update orgs" ON organizations;
DROP POLICY IF EXISTS "Invites Select" ON organization_invites;
DROP POLICY IF EXISTS "Invites Insert" ON organization_invites;
DROP POLICY IF EXISTS "Invites Update" ON organization_invites;

-- 12. Update RLS policies to remove organization checks
-- Roles
DROP POLICY IF EXISTS "Roles Select" ON roles;
DROP POLICY IF EXISTS "Roles Insert" ON roles;
DROP POLICY IF EXISTS "Roles Update" ON roles;
DROP POLICY IF EXISTS "Roles Delete" ON roles;

CREATE POLICY "Roles Select" ON roles FOR SELECT USING (has_permission('roles', 'read'));
CREATE POLICY "Roles Insert" ON roles FOR INSERT WITH CHECK (has_permission('roles', 'write'));
CREATE POLICY "Roles Update" ON roles FOR UPDATE USING (has_permission('roles', 'write'));
CREATE POLICY "Roles Delete" ON roles FOR DELETE USING (has_permission('roles', 'delete') AND is_system_role = FALSE);

-- Role Permissions
DROP POLICY IF EXISTS "Permissions Select" ON role_permissions;
DROP POLICY IF EXISTS "Permissions Manage" ON role_permissions;

CREATE POLICY "Permissions Select" ON role_permissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.id = role_permissions.role_id 
    AND has_permission('roles', 'read')
  )
);
CREATE POLICY "Permissions Manage" ON role_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.id = role_permissions.role_id 
    AND has_permission('roles', 'write')
  )
);

-- Collaborators
DROP POLICY IF EXISTS "Collabs Select" ON collaborators;
DROP POLICY IF EXISTS "Collabs Insert" ON collaborators;
DROP POLICY IF EXISTS "Collabs Update" ON collaborators;
DROP POLICY IF EXISTS "Collabs Delete" ON collaborators;

CREATE POLICY "Collabs Select" ON collaborators FOR SELECT USING (has_permission('collaborators', 'read'));
CREATE POLICY "Collabs Insert" ON collaborators FOR INSERT WITH CHECK (has_permission('collaborators', 'write') OR auth.uid() IS NULL);
CREATE POLICY "Collabs Update" ON collaborators FOR UPDATE USING (has_permission('collaborators', 'write'));
CREATE POLICY "Collabs Delete" ON collaborators FOR DELETE USING (has_permission('collaborators', 'delete'));

-- Clients
DROP POLICY IF EXISTS "Clients Select" ON clients;
DROP POLICY IF EXISTS "Clients Insert" ON clients;
DROP POLICY IF EXISTS "Clients Update" ON clients;
DROP POLICY IF EXISTS "Clients Delete" ON clients;

CREATE POLICY "Clients Select" ON clients FOR SELECT USING (has_permission('clients', 'read'));
CREATE POLICY "Clients Insert" ON clients FOR INSERT WITH CHECK (has_permission('clients', 'write'));
CREATE POLICY "Clients Update" ON clients FOR UPDATE USING (has_permission('clients', 'write'));
CREATE POLICY "Clients Delete" ON clients FOR DELETE USING (has_permission('clients', 'delete'));

-- Tags
DROP POLICY IF EXISTS "Tags Select" ON tags;
DROP POLICY IF EXISTS "Tags Insert" ON tags;
DROP POLICY IF EXISTS "Tags Update" ON tags;
DROP POLICY IF EXISTS "Tags Delete" ON tags;

CREATE POLICY "Tags Select" ON tags FOR SELECT USING (has_permission('tags', 'read'));
CREATE POLICY "Tags Insert" ON tags FOR INSERT WITH CHECK (has_permission('tags', 'write'));
CREATE POLICY "Tags Update" ON tags FOR UPDATE USING (has_permission('tags', 'write'));
CREATE POLICY "Tags Delete" ON tags FOR DELETE USING (has_permission('tags', 'delete'));

-- Client Tags
DROP POLICY IF EXISTS "Client Tags Select" ON client_tags;
DROP POLICY IF EXISTS "Client Tags Manage" ON client_tags;

CREATE POLICY "Client Tags Select" ON client_tags FOR SELECT USING (has_permission('clients', 'read'));
CREATE POLICY "Client Tags Manage" ON client_tags FOR ALL USING (has_permission('clients', 'write'));

-- Contracts
DROP POLICY IF EXISTS "Contracts Select" ON contracts;
DROP POLICY IF EXISTS "Contracts Insert" ON contracts;
DROP POLICY IF EXISTS "Contracts Update" ON contracts;
DROP POLICY IF EXISTS "Contracts Delete" ON contracts;

CREATE POLICY "Contracts Select" ON contracts FOR SELECT USING (has_permission('contracts', 'read'));
CREATE POLICY "Contracts Insert" ON contracts FOR INSERT WITH CHECK (has_permission('contracts', 'write'));
CREATE POLICY "Contracts Update" ON contracts FOR UPDATE USING (has_permission('contracts', 'write'));
CREATE POLICY "Contracts Delete" ON contracts FOR DELETE USING (has_permission('contracts', 'delete'));

-- Contract Assignments
DROP POLICY IF EXISTS "Assignments Select" ON contract_assignments;
DROP POLICY IF EXISTS "Assignments Insert" ON contract_assignments;
DROP POLICY IF EXISTS "Assignments Update" ON contract_assignments;
DROP POLICY IF EXISTS "Assignments Delete" ON contract_assignments;

CREATE POLICY "Assignments Select" ON contract_assignments FOR SELECT USING (has_permission('contract_assignments', 'read'));
CREATE POLICY "Assignments Insert" ON contract_assignments FOR INSERT WITH CHECK (has_permission('contract_assignments', 'write'));
CREATE POLICY "Assignments Update" ON contract_assignments FOR UPDATE USING (has_permission('contract_assignments', 'write'));
CREATE POLICY "Assignments Delete" ON contract_assignments FOR DELETE USING (has_permission('contract_assignments', 'delete'));

-- Audit Logs
DROP POLICY IF EXISTS "Audit Logs Select" ON audit_logs;

CREATE POLICY "Audit Logs Select" ON audit_logs FOR SELECT USING (
  has_permission('audit_logs', 'read')
);
