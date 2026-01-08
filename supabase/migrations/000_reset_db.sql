-- =====================================================
-- RESET DATABASE - Clean Everything
-- =====================================================

-- 1. Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_client_identifier ON clients;
DROP TRIGGER IF EXISTS audit_orgs ON organizations;
DROP TRIGGER IF EXISTS audit_roles ON roles;
DROP TRIGGER IF EXISTS audit_collabs ON collaborators;
DROP TRIGGER IF EXISTS audit_clients ON clients;
DROP TRIGGER IF EXISTS audit_contracts ON contracts;
DROP TRIGGER IF EXISTS audit_assignments ON contract_assignments;
DROP TRIGGER IF EXISTS audit_tags ON tags;
DROP TRIGGER IF EXISTS audit_client_tags ON client_tags;

DROP TRIGGER IF EXISTS update_orgs_modtime ON organizations;
DROP TRIGGER IF EXISTS update_collabs_modtime ON collaborators;
DROP TRIGGER IF EXISTS update_clients_modtime ON clients;
DROP TRIGGER IF EXISTS update_contracts_modtime ON contracts;
DROP TRIGGER IF EXISTS update_assignments_modtime ON contract_assignments;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS generate_client_identifier CASCADE;
DROP FUNCTION IF EXISTS is_org_member CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- 3. Drop Tables (Reverse Order of Dependencies)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS contract_assignments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS client_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS collaborators CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 4. Drop Types
DROP TYPE IF EXISTS client_status CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS employment_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- 5. Drop Extensions (Optional, usually kept)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

