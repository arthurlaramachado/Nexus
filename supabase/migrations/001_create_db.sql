-- =====================================================
-- COMPLETE DATABASE SCHEMA WITH RBAC
-- =====================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
CREATE TYPE client_status AS ENUM ('active', 'inactive');
CREATE TYPE contract_type AS ENUM ('new_deal', 'renewed', 'upsell', 'downsell', 'not_renewed', 'churn', 'cut');
CREATE TYPE contract_status AS ENUM ('active', 'paused', 'inactive');
CREATE TYPE employment_status AS ENUM ('active', 'invited', 'inactive');
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- 3. Create Tables

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Role Permissions
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

-- Collaborators
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status employment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, email),
  UNIQUE(organization_id, user_id)
);

-- Deferrable constraint for user_id
ALTER TABLE collaborators 
  DROP CONSTRAINT IF EXISTS collaborators_user_id_fkey,
  ADD CONSTRAINT collaborators_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL 
  DEFERRABLE INITIALLY DEFERRED;

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status client_status NOT NULL DEFAULT 'active',
  country TEXT,
  city TEXT,
  unique_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, unique_identifier)
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Client Tags Junction
CREATE TABLE client_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, -- Denormalized for simpler RLS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, tag_id)
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  contract_type contract_type NOT NULL,
  status contract_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE,
  contract_value DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Assignments
CREATE TABLE contract_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX idx_collab_org_user ON collaborators(organization_id, user_id);
CREATE INDEX idx_collab_email ON collaborators(email);
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_contracts_org ON contracts(organization_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_assignments_contract ON contract_assignments(contract_id);
CREATE INDEX idx_assignments_collab ON contract_assignments(collaborator_id);
CREATE INDEX idx_tags_org ON tags(organization_id);
CREATE INDEX idx_client_tags_client ON client_tags(client_id);
CREATE INDEX idx_client_tags_tag ON client_tags(tag_id);

-- 5. Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orgs_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collabs_modtime BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_modtime BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON contract_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Audit Log Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '[]'::JSONB;
  old_data JSONB;
  new_data JSONB;
  field_name TEXT;
  old_val JSONB;
  new_val JSONB;
  org_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    IF old_data ? 'organization_id' THEN
      org_id := (old_data->>'organization_id')::UUID;
    END IF;
  ELSE
    new_data := to_jsonb(NEW);
    IF new_data ? 'organization_id' THEN
      org_id := (new_data->>'organization_id')::UUID;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, organization_id, table_name, record_id, action, changes)
    VALUES (auth.uid(), org_id, TG_TABLE_NAME, (old_data->>'id')::UUID, 'delete', to_jsonb(OLD));
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
      INSERT INTO audit_logs (user_id, organization_id, table_name, record_id, action, changes)
      VALUES (auth.uid(), org_id, TG_TABLE_NAME, (new_data->>'id')::UUID, 'update', changes);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, organization_id, table_name, record_id, action, changes)
    VALUES (auth.uid(), org_id, TG_TABLE_NAME, (new_data->>'id')::UUID, 'insert', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_orgs AFTER INSERT OR UPDATE OR DELETE ON organizations FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_collabs AFTER INSERT OR UPDATE OR DELETE ON collaborators FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_assignments AFTER INSERT OR UPDATE OR DELETE ON contract_assignments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_tags AFTER INSERT OR UPDATE OR DELETE ON tags FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_client_tags AFTER INSERT OR UPDATE OR DELETE ON client_tags FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 7. RBAC and Permission Functions

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM collaborators
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

  -- System roles (Admin) have all permissions
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

-- Get all permissions for the current user
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

  -- If system role, return all tables with full access
  -- Note: table_names should match what's in the app
  IF user_is_system_role THEN
    RETURN QUERY 
    SELECT t.name, TRUE, TRUE, TRUE
    FROM (
      SELECT unnest(ARRAY['organizations', 'roles', 'collaborators', 'clients', 'tags', 'contracts', 'contract_assignments', 'audit_logs']) as name
    ) t;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT rp.table_name, rp.can_read, rp.can_write, rp.can_delete
  FROM role_permissions rp
  WHERE rp.role_id = user_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 8. Client Identifier Trigger
CREATE OR REPLACE FUNCTION generate_client_identifier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_identifier IS NULL OR NEW.unique_identifier = '' THEN
    NEW.unique_identifier := 'CL-' || upper(substr(md5(random()::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_client_identifier
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_client_identifier();

-- 9. Signup Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id UUID;
  new_role_id UUID;
  user_name TEXT;
  user_email TEXT;
  table_names TEXT[] := ARRAY['organizations', 'roles', 'collaborators', 'clients', 'tags', 'contracts', 'contract_assignments', 'audit_logs'];
  tname TEXT;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));

  INSERT INTO organizations (name)
  VALUES (user_email || '''s Organization')
  RETURNING id INTO new_org_id;

  INSERT INTO roles (organization_id, name, is_system_role)
  VALUES (new_org_id, 'Admin', TRUE)
  RETURNING id INTO new_role_id;

  FOREACH tname IN ARRAY table_names LOOP
    INSERT INTO role_permissions (role_id, table_name, can_read, can_write, can_delete)
    VALUES (new_role_id, tname, TRUE, TRUE, TRUE);
  END LOOP;

  INSERT INTO collaborators (organization_id, user_id, role_id, full_name, email, status)
  VALUES (new_org_id, NEW.id, new_role_id, user_name, user_email, 'active');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Signup Trigger Failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 10. RLS Policies

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "Members view orgs" ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY "Service role insert orgs" ON organizations FOR INSERT WITH CHECK (true);

-- Roles
CREATE POLICY "Roles Select" ON roles FOR SELECT USING (has_permission('roles', 'read') AND is_org_member(organization_id));
CREATE POLICY "Roles Insert" ON roles FOR INSERT WITH CHECK (has_permission('roles', 'write') AND is_org_member(organization_id));
CREATE POLICY "Roles Update" ON roles FOR UPDATE USING (has_permission('roles', 'write') AND is_org_member(organization_id));
CREATE POLICY "Roles Delete" ON roles FOR DELETE USING (has_permission('roles', 'delete') AND is_org_member(organization_id) AND is_system_role = FALSE);

-- Role Permissions
CREATE POLICY "Permissions Select" ON role_permissions FOR SELECT USING (has_permission('roles', 'read'));
CREATE POLICY "Permissions Manage" ON role_permissions FOR ALL USING (has_permission('roles', 'write'));

-- Collaborators
CREATE POLICY "Collabs Select" ON collaborators FOR SELECT USING (has_permission('collaborators', 'read') AND is_org_member(organization_id));
CREATE POLICY "Collabs Insert" ON collaborators FOR INSERT WITH CHECK (has_permission('collaborators', 'write') OR auth.uid() IS NULL);
CREATE POLICY "Collabs Update" ON collaborators FOR UPDATE USING (has_permission('collaborators', 'write') AND is_org_member(organization_id));
CREATE POLICY "Collabs Delete" ON collaborators FOR DELETE USING (has_permission('collaborators', 'delete') AND is_org_member(organization_id));

-- Clients
CREATE POLICY "Clients Select" ON clients FOR SELECT USING (has_permission('clients', 'read') AND is_org_member(organization_id));
CREATE POLICY "Clients Insert" ON clients FOR INSERT WITH CHECK (has_permission('clients', 'write') AND is_org_member(organization_id));
CREATE POLICY "Clients Update" ON clients FOR UPDATE USING (has_permission('clients', 'write') AND is_org_member(organization_id));
CREATE POLICY "Clients Delete" ON clients FOR DELETE USING (has_permission('clients', 'delete') AND is_org_member(organization_id));

-- Tags
CREATE POLICY "Tags Select" ON tags FOR SELECT USING (has_permission('tags', 'read') AND is_org_member(organization_id));
CREATE POLICY "Tags Insert" ON tags FOR INSERT WITH CHECK (has_permission('tags', 'write') AND is_org_member(organization_id));
CREATE POLICY "Tags Update" ON tags FOR UPDATE USING (has_permission('tags', 'write') AND is_org_member(organization_id));
CREATE POLICY "Tags Delete" ON tags FOR DELETE USING (has_permission('tags', 'delete') AND is_org_member(organization_id));

-- Client Tags
CREATE POLICY "Client Tags Select" ON client_tags FOR SELECT USING (has_permission('clients', 'read') AND is_org_member(organization_id));
CREATE POLICY "Client Tags Manage" ON client_tags FOR ALL USING (has_permission('clients', 'write') AND is_org_member(organization_id));

-- Contracts
CREATE POLICY "Contracts Select" ON contracts FOR SELECT USING (has_permission('contracts', 'read') AND is_org_member(organization_id));
CREATE POLICY "Contracts Insert" ON contracts FOR INSERT WITH CHECK (has_permission('contracts', 'write') AND is_org_member(organization_id));
CREATE POLICY "Contracts Update" ON contracts FOR UPDATE USING (has_permission('contracts', 'write') AND is_org_member(organization_id));
CREATE POLICY "Contracts Delete" ON contracts FOR DELETE USING (has_permission('contracts', 'delete') AND is_org_member(organization_id));

-- Contract Assignments
CREATE POLICY "Assignments Select" ON contract_assignments FOR SELECT USING (has_permission('contract_assignments', 'read') AND is_org_member(organization_id));
CREATE POLICY "Assignments Insert" ON contract_assignments FOR INSERT WITH CHECK (has_permission('contract_assignments', 'write') AND is_org_member(organization_id));
CREATE POLICY "Assignments Update" ON contract_assignments FOR UPDATE USING (has_permission('contract_assignments', 'write') AND is_org_member(organization_id));
CREATE POLICY "Assignments Delete" ON contract_assignments FOR DELETE USING (has_permission('contract_assignments', 'delete') AND is_org_member(organization_id));

-- Audit Logs
CREATE POLICY "Audit Logs Select" ON audit_logs FOR SELECT USING (has_permission('audit_logs', 'read') AND is_org_member(organization_id));
