-- =====================================================
-- ADD SERVICES ENTITY
-- =====================================================
-- Services represent what is offered within contracts.
-- Many-to-many relationship via contract_services junction table.
-- =====================================================

-- 1. Create Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Contract Services junction table
CREATE TABLE contract_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, service_id)
);

-- 3. Indexes
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_contract_services_contract ON contract_services(contract_id);
CREATE INDEX idx_contract_services_service ON contract_services(service_id);

-- 4. Updated_at trigger for services
CREATE TRIGGER update_services_modtime
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Audit triggers
CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contract_services
  AFTER INSERT OR UPDATE OR DELETE ON contract_services
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- 6. Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_services ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for services
CREATE POLICY "Services Select" ON services
  FOR SELECT USING (has_permission('services', 'read'));

CREATE POLICY "Services Insert" ON services
  FOR INSERT WITH CHECK (has_permission('services', 'write'));

CREATE POLICY "Services Update" ON services
  FOR UPDATE USING (has_permission('services', 'write'));

CREATE POLICY "Services Delete" ON services
  FOR DELETE USING (has_permission('services', 'delete'));

-- 8. RLS Policies for contract_services (inherits from contracts permissions)
CREATE POLICY "Contract Services Select" ON contract_services
  FOR SELECT USING (has_permission('contracts', 'read'));

CREATE POLICY "Contract Services Insert" ON contract_services
  FOR INSERT WITH CHECK (has_permission('contracts', 'write'));

CREATE POLICY "Contract Services Delete" ON contract_services
  FOR DELETE USING (has_permission('contracts', 'write'));

-- 9. Update get_user_permissions to include services
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

-- 10. Grant Admin role permissions on services
DO $$
DECLARE
  admin_role_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';

  IF admin_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, table_name, can_read, can_write, can_delete)
    VALUES (admin_role_id, 'services', TRUE, TRUE, TRUE)
    ON CONFLICT (role_id, table_name) DO NOTHING;
  END IF;
END $$;
