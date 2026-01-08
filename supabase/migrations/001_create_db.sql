-- =====================================================
-- COMPLETE DATABASE SCHEMA
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
  -- industry removed in favor of tags
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
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, -- Denormalized for simpler RLS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (client_id, tag_id)
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

-- 7. RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM collaborators
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policies
CREATE POLICY "Members can view their organizations" ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY "Service role can insert organizations" ON organizations FOR INSERT WITH CHECK (true);

CREATE POLICY "Members can view roles" ON roles FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can manage roles" ON roles FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members can view collaborators" ON collaborators FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "Members can manage collaborators" ON collaborators FOR ALL USING (is_org_member(organization_id));
CREATE POLICY "Service role can insert collaborators" ON collaborators FOR INSERT WITH CHECK (true);

CREATE POLICY "Members access clients" ON clients FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members access tags" ON tags FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members access client_tags" ON client_tags FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members access contracts" ON contracts FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members access assignments" ON contract_assignments FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Members access logs" ON audit_logs FOR SELECT USING (organization_id IS NOT NULL AND is_org_member(organization_id));

-- 8. Signup Trigger
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
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(user_email, '@', 1));

  INSERT INTO organizations (name)
  VALUES (user_email || '''s Organization')
  RETURNING id INTO new_org_id;

  INSERT INTO roles (organization_id, name, is_system_role)
  VALUES (new_org_id, 'Admin', TRUE)
  RETURNING id INTO new_role_id;

  INSERT INTO collaborators (organization_id, user_id, role_id, full_name, email, status)
  VALUES (new_org_id, NEW.id, new_role_id, user_name, user_email, 'active');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Signup Trigger Failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 9. Client Identifier Trigger
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

-- 10. Attach Signup Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

