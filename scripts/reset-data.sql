-- =============================================================================
-- NexusCS - Full Reset & Schema Rebuild
-- Drops all objects and recreates the complete schema from scratch.
-- Run with service_role key. Run seed-data.sql after this.
-- =============================================================================

-- =====================================================
-- PHASE 1: DROP EVERYTHING
-- =====================================================

-- 1. Drop Tables (CASCADE removes dependent triggers, indexes, policies)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS contract_services CASCADE;
DROP TABLE IF EXISTS contract_assignments CASCADE;
DROP TABLE IF EXISTS contract_logs CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS client_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS collaborators CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS generate_client_identifier() CASCADE;
DROP FUNCTION IF EXISTS has_permission(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_permissions() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_contract_state() CASCADE;

-- 3. Drop Types
DROP TYPE IF EXISTS client_status CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS termination_reason CASCADE;
DROP TYPE IF EXISTS employment_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- =====================================================
-- PHASE 2: RECREATE SCHEMA (001_create_db.sql)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE client_status AS ENUM ('active', 'inactive');
CREATE TYPE contract_status AS ENUM ('ACTIVE', 'ENDED');
CREATE TYPE termination_reason AS ENUM ('NOT_RENEWED', 'CHURN', 'CUT', 'RENEWED');
CREATE TYPE employment_status AS ENUM ('active', 'invited', 'inactive');
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- Tables
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_write BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, table_name)
);

CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status employment_status NOT NULL DEFAULT 'active',
  invite_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE collaborators
  DROP CONSTRAINT IF EXISTS collaborators_user_id_fkey,
  ADD CONSTRAINT collaborators_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status client_status NOT NULL DEFAULT 'active',
  country TEXT,
  city TEXT,
  unique_identifier TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, tag_id)
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status contract_status NOT NULL DEFAULT 'ACTIVE',
  termination_reason termination_reason,
  termination_description TEXT,
  previous_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  current_value DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_active_no_termination CHECK (
    (status = 'ACTIVE' AND termination_reason IS NULL) OR
    (status = 'ENDED')
  )
);

CREATE TABLE contract_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('UPSELL', 'DOWNSELL', 'CHURN', 'CUT', 'NOT_RENEWED', 'RENEWAL_EXIT', 'RENEWAL_ENTRY')),
  old_value DECIMAL(15, 2),
  new_value DECIMAL(15, 2),
  delta_value DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE contract_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  role_on_contract TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  allocation_percentage DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, collaborator_id, start_date)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services (migration 003)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contract_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, service_id)
);

-- Indexes
CREATE INDEX idx_collab_email ON collaborators(email);
CREATE INDEX idx_collab_user_id ON collaborators(user_id);
CREATE INDEX idx_collab_invite_token ON collaborators(invite_token);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_previous ON contracts(previous_contract_id);
CREATE INDEX idx_contract_logs_contract ON contract_logs(contract_id);
CREATE INDEX idx_contract_logs_action ON contract_logs(action_type);
CREATE INDEX idx_contract_logs_created ON contract_logs(created_at);
CREATE INDEX idx_assignments_contract ON contract_assignments(contract_id);
CREATE INDEX idx_assignments_collab ON contract_assignments(collaborator_id);
CREATE INDEX idx_client_tags_client ON client_tags(client_id);
CREATE INDEX idx_client_tags_tag ON client_tags(tag_id);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_contract_services_contract ON contract_services(contract_id);
CREATE INDEX idx_contract_services_service ON contract_services(service_id);

-- =====================================================
-- PHASE 3: FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collabs_modtime BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_modtime BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON contract_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '[]'::JSONB;
  old_data JSONB;
  new_data JSONB;
  field_name TEXT;
  old_val JSONB;
  new_val JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    INSERT INTO audit_logs (user_id, table_name, record_id, action, changes)
    VALUES (auth.uid(), TG_TABLE_NAME, (old_data->>'id')::UUID, 'delete', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    FOR field_name IN SELECT key FROM jsonb_each(new_data) LOOP
      old_val := old_data->field_name;
      new_val := new_data->field_name;
      IF field_name NOT IN ('id', 'created_at', 'updated_at') AND old_val IS DISTINCT FROM new_val THEN
        changes := changes || jsonb_build_object('field', field_name, 'old', old_val, 'new', new_val);
      END IF;
    END LOOP;
    IF jsonb_array_length(changes) > 0 THEN
      INSERT INTO audit_logs (user_id, table_name, record_id, action, changes)
      VALUES (auth.uid(), TG_TABLE_NAME, (new_data->>'id')::UUID, 'update', changes);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (user_id, table_name, record_id, action, changes)
    VALUES (auth.uid(), TG_TABLE_NAME, (new_data->>'id')::UUID, 'insert', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_collabs AFTER INSERT OR UPDATE OR DELETE ON collaborators FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contract_logs AFTER INSERT OR UPDATE OR DELETE ON contract_logs FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_assignments AFTER INSERT OR UPDATE OR DELETE ON contract_assignments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_tags AFTER INSERT OR UPDATE OR DELETE ON tags FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_client_tags AFTER INSERT OR UPDATE OR DELETE ON client_tags FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_services AFTER INSERT OR UPDATE OR DELETE ON services FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contract_services AFTER INSERT OR UPDATE OR DELETE ON contract_services FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Contract state validation
CREATE OR REPLACE FUNCTION validate_contract_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ACTIVE' AND NEW.termination_reason IS NOT NULL THEN
    RAISE EXCEPTION 'ACTIVE contracts cannot have a termination_reason';
  END IF;
  IF NEW.status = 'ACTIVE' AND NEW.termination_description IS NOT NULL THEN
    RAISE EXCEPTION 'ACTIVE contracts cannot have a termination_description';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_contract_state_trigger BEFORE INSERT OR UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION validate_contract_state();

-- Client identifier auto-generation
CREATE OR REPLACE FUNCTION generate_client_identifier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_identifier IS NULL OR NEW.unique_identifier = '' THEN
    NEW.unique_identifier := 'CL-' || upper(substr(md5(random()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_client_identifier BEFORE INSERT ON clients FOR EACH ROW EXECUTE FUNCTION generate_client_identifier();

-- RBAC functions
CREATE OR REPLACE FUNCTION has_permission(target_table_name TEXT, permission_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_id UUID;
  user_is_system_role BOOLEAN;
BEGIN
  SELECT r.id, r.is_system_role INTO user_role_id, user_is_system_role
  FROM collaborators c
  JOIN roles r ON c.role_id = r.id
  WHERE c.user_id = auth.uid()
  AND c.status = 'active'
  LIMIT 1;

  IF user_role_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF user_is_system_role THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role_id = user_role_id
    AND table_name = target_table_name
    AND (
      (permission_type = 'read' AND can_read) OR
      (permission_type = 'write' AND can_write) OR
      (permission_type = 'delete' AND can_delete)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_permissions()
RETURNS TABLE (
  table_name TEXT,
  can_read BOOLEAN,
  can_write BOOLEAN,
  can_delete BOOLEAN
) AS $$
DECLARE
  user_role_id UUID;
  user_is_system_role BOOLEAN;
BEGIN
  SELECT r.id, r.is_system_role INTO user_role_id, user_is_system_role
  FROM collaborators c
  JOIN roles r ON c.role_id = r.id
  WHERE c.user_id = auth.uid()
  AND c.status = 'active'
  LIMIT 1;

  IF user_role_id IS NULL THEN
    RETURN;
  END IF;

  IF user_is_system_role THEN
    RETURN QUERY
    SELECT t.name, TRUE, TRUE, TRUE
    FROM (
      SELECT unnest(ARRAY[
        'roles', 'collaborators', 'clients', 'tags',
        'contracts', 'contract_assignments', 'audit_logs',
        'services'
      ]) as name
    ) t;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT rp.table_name, rp.can_read, rp.can_write, rp.can_delete
  FROM role_permissions rp
  WHERE rp.role_id = user_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- =====================================================
-- PHASE 4: RLS POLICIES
-- =====================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_services ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE POLICY "Roles Select" ON roles FOR SELECT USING (has_permission('roles', 'read'));
CREATE POLICY "Roles Insert" ON roles FOR INSERT WITH CHECK (has_permission('roles', 'write'));
CREATE POLICY "Roles Update" ON roles FOR UPDATE USING (has_permission('roles', 'write'));
CREATE POLICY "Roles Delete" ON roles FOR DELETE USING (has_permission('roles', 'delete') AND is_system_role = FALSE);

-- Role Permissions
CREATE POLICY "Permissions Select" ON role_permissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id AND has_permission('roles', 'read'))
);
CREATE POLICY "Permissions Manage" ON role_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM roles r WHERE r.id = role_permissions.role_id AND has_permission('roles', 'write'))
);

-- Collaborators
CREATE POLICY "Allow invited collaborators to be read by invite token" ON collaborators FOR SELECT
USING (status = 'invited' AND invite_token IS NOT NULL AND (expires_at IS NULL OR expires_at > NOW()));
CREATE POLICY "Collabs Select" ON collaborators FOR SELECT USING (has_permission('collaborators', 'read'));
CREATE POLICY "Collabs Insert" ON collaborators FOR INSERT WITH CHECK (has_permission('collaborators', 'write'));
CREATE POLICY "Collabs Update" ON collaborators FOR UPDATE USING (has_permission('collaborators', 'write'));
CREATE POLICY "Collabs Delete" ON collaborators FOR DELETE USING (has_permission('collaborators', 'delete'));

-- Clients
CREATE POLICY "Clients Select" ON clients FOR SELECT USING (has_permission('clients', 'read'));
CREATE POLICY "Clients Insert" ON clients FOR INSERT WITH CHECK (has_permission('clients', 'write'));
CREATE POLICY "Clients Update" ON clients FOR UPDATE USING (has_permission('clients', 'write'));
CREATE POLICY "Clients Delete" ON clients FOR DELETE USING (has_permission('clients', 'delete'));

-- Tags
CREATE POLICY "Tags Select" ON tags FOR SELECT USING (has_permission('tags', 'read'));
CREATE POLICY "Tags Insert" ON tags FOR INSERT WITH CHECK (has_permission('tags', 'write'));
CREATE POLICY "Tags Update" ON tags FOR UPDATE USING (has_permission('tags', 'write'));
CREATE POLICY "Tags Delete" ON tags FOR DELETE USING (has_permission('tags', 'delete'));

-- Client Tags
CREATE POLICY "Client Tags Select" ON client_tags FOR SELECT USING (has_permission('clients', 'read'));
CREATE POLICY "Client Tags Manage" ON client_tags FOR ALL USING (has_permission('clients', 'write'));

-- Contracts
CREATE POLICY "Contracts Select" ON contracts FOR SELECT USING (has_permission('contracts', 'read'));
CREATE POLICY "Contracts Insert" ON contracts FOR INSERT WITH CHECK (has_permission('contracts', 'write'));
CREATE POLICY "Contracts Update" ON contracts FOR UPDATE USING (has_permission('contracts', 'write'));
CREATE POLICY "Contracts Delete" ON contracts FOR DELETE USING (has_permission('contracts', 'delete'));

-- Contract Logs
CREATE POLICY "Contract Logs Select" ON contract_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_logs.contract_id AND has_permission('contracts', 'read')));
CREATE POLICY "Contract Logs Insert" ON contract_logs FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_logs.contract_id AND has_permission('contracts', 'write')));
CREATE POLICY "Contract Logs Manage" ON contract_logs FOR ALL
USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_logs.contract_id AND has_permission('contracts', 'write')));

-- Contract Assignments
CREATE POLICY "Assignments Select" ON contract_assignments FOR SELECT USING (has_permission('contract_assignments', 'read'));
CREATE POLICY "Assignments Insert" ON contract_assignments FOR INSERT WITH CHECK (has_permission('contract_assignments', 'write'));
CREATE POLICY "Assignments Update" ON contract_assignments FOR UPDATE USING (has_permission('contract_assignments', 'write'));
CREATE POLICY "Assignments Delete" ON contract_assignments FOR DELETE USING (has_permission('contract_assignments', 'delete'));

-- Audit Logs
CREATE POLICY "Audit Logs Select" ON audit_logs FOR SELECT USING (has_permission('audit_logs', 'read'));

-- Services
CREATE POLICY "Services Select" ON services FOR SELECT USING (has_permission('services', 'read'));
CREATE POLICY "Services Insert" ON services FOR INSERT WITH CHECK (has_permission('services', 'write'));
CREATE POLICY "Services Update" ON services FOR UPDATE USING (has_permission('services', 'write'));
CREATE POLICY "Services Delete" ON services FOR DELETE USING (has_permission('services', 'delete'));

-- Contract Services
CREATE POLICY "Contract Services Select" ON contract_services FOR SELECT USING (has_permission('contracts', 'read'));
CREATE POLICY "Contract Services Insert" ON contract_services FOR INSERT WITH CHECK (has_permission('contracts', 'write'));
CREATE POLICY "Contract Services Delete" ON contract_services FOR DELETE USING (has_permission('contracts', 'write'));

-- =====================================================
-- PHASE 5: SEED ADMIN ROLE
-- =====================================================

DO $$
DECLARE
  admin_role_id UUID;
  table_names TEXT[] := ARRAY['roles', 'collaborators', 'clients', 'tags', 'contracts', 'contract_assignments', 'audit_logs', 'services'];
  tname TEXT;
BEGIN
  INSERT INTO roles (name, is_system_role) VALUES ('Admin', TRUE)
  RETURNING id INTO admin_role_id;

  FOREACH tname IN ARRAY table_names LOOP
    INSERT INTO role_permissions (role_id, table_name, can_read, can_write, can_delete)
    VALUES (admin_role_id, tname, TRUE, TRUE, TRUE);
  END LOOP;

  INSERT INTO collaborators (user_id, role_id, full_name, email, status)
  VALUES (NULL, admin_role_id, 'System Admin', 'admin@admin.com', 'active');
END $$;

-- =============================================================================
-- DONE. Schema rebuilt, Admin role seeded.
-- Run seed-data.sql next to populate with sample data.
-- =============================================================================
