-- Contract Lifecycle & Logging System Migration
-- This migration refactors contracts to use status + termination_reason instead of contract_type
-- and adds contract_logs table for financial tracking

-- 1. Create termination_reason enum
CREATE TYPE termination_reason AS ENUM ('NOT_RENEWED', 'CHURN', 'CUT', 'RENEWED');

-- 2. Update contract_status enum (remove 'paused' and 'inactive', keep only 'ACTIVE' and 'ENDED')
-- We need to recreate the enum since PostgreSQL doesn't support removing enum values directly
ALTER TYPE contract_status RENAME TO contract_status_old;
CREATE TYPE contract_status AS ENUM ('ACTIVE', 'ENDED');

-- 3. Update contracts table
-- First, add new columns
ALTER TABLE contracts 
  ADD COLUMN IF NOT EXISTS termination_reason termination_reason,
  ADD COLUMN IF NOT EXISTS previous_contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Rename contract_value to current_value
ALTER TABLE contracts RENAME COLUMN contract_value TO current_value;

-- Migrate existing data: update status based on current values
-- Map old status values to new ones
UPDATE contracts 
SET status = CASE 
  WHEN status::text = 'active' THEN 'ACTIVE'::contract_status
  WHEN status::text IN ('paused', 'inactive') THEN 'ENDED'::contract_status
  ELSE 'ACTIVE'::contract_status
END::contract_status;

-- Update contract_type values to termination_reason where applicable
-- For contracts that are ended, map old contract_type to termination_reason
UPDATE contracts 
SET termination_reason = CASE 
  WHEN contract_type::text = 'not_renewed' THEN 'NOT_RENEWED'::termination_reason
  WHEN contract_type::text = 'churn' THEN 'CHURN'::termination_reason
  WHEN contract_type::text = 'cut' THEN 'CUT'::termination_reason
  WHEN contract_type::text = 'renewed' THEN 'RENEWED'::termination_reason
  ELSE NULL
END
WHERE contract_type::text IN ('not_renewed', 'churn', 'cut', 'renewed');

-- Set status to ENDED for contracts with termination_reason
UPDATE contracts 
SET status = 'ENDED'::contract_status
WHERE termination_reason IS NOT NULL;

-- Now change the status column type
ALTER TABLE contracts 
  ALTER COLUMN status TYPE contract_status USING status::text::contract_status;

-- Drop old enum
DROP TYPE contract_status_old;

-- Remove contract_type column
ALTER TABLE contracts DROP COLUMN IF EXISTS contract_type;

-- Drop contract_type enum (if no other tables use it)
DROP TYPE IF EXISTS contract_type;

-- 4. Add constraint: ACTIVE contracts cannot have termination_reason
ALTER TABLE contracts 
  ADD CONSTRAINT check_active_no_termination 
  CHECK (
    (status = 'ACTIVE' AND termination_reason IS NULL) OR 
    (status = 'ENDED')
  );

-- 5. Create contract_logs table
CREATE TABLE IF NOT EXISTS contract_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('UPSELL', 'DOWNSELL', 'CHURN', 'CUT', 'NOT_RENEWED', 'RENEWAL_EXIT', 'RENEWAL_ENTRY')),
  old_value DECIMAL(15, 2),
  new_value DECIMAL(15, 2),
  delta_value DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 6. Add indexes
CREATE INDEX IF NOT EXISTS idx_contract_logs_contract ON contract_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_logs_action ON contract_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_contract_logs_created ON contract_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_previous ON contracts(previous_contract_id);

-- 7. Add audit trigger for contract_logs
CREATE TRIGGER audit_contract_logs AFTER INSERT OR UPDATE OR DELETE ON contract_logs FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 8. Enable RLS on contract_logs
ALTER TABLE contract_logs ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for contract_logs
-- Read: Users can read logs for contracts they have read permission
CREATE POLICY "Contract Logs Select" ON contract_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_logs.contract_id
    AND has_permission('contracts', 'read')
  )
);

-- Write: Users can create logs for contracts they have write permission
CREATE POLICY "Contract Logs Insert" ON contract_logs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_logs.contract_id
    AND has_permission('contracts', 'write')
  )
);

-- Update/Delete: Only users with write permission can modify logs
CREATE POLICY "Contract Logs Manage" ON contract_logs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_logs.contract_id
    AND has_permission('contracts', 'write')
  )
);

-- 10. Function to validate contract state transitions
CREATE OR REPLACE FUNCTION validate_contract_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure ACTIVE contracts don't have termination_reason
  IF NEW.status = 'ACTIVE' AND NEW.termination_reason IS NOT NULL THEN
    RAISE EXCEPTION 'ACTIVE contracts cannot have a termination_reason';
  END IF;
  
  -- Ensure ENDED contracts have termination_reason (except during renewal process)
  -- Actually, we'll allow ENDED without reason for flexibility during transitions
  -- The application logic will enforce this
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Add trigger to validate contract state
CREATE TRIGGER validate_contract_state_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_state();
