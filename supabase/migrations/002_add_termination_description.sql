-- Add termination_description column to contracts
ALTER TABLE contracts ADD COLUMN termination_description TEXT;

-- Ensure ACTIVE contracts don't have termination_description
-- Update the existing validate_contract_state function
CREATE OR REPLACE FUNCTION validate_contract_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure ACTIVE contracts don't have termination_reason
  IF NEW.status = 'ACTIVE' AND NEW.termination_reason IS NOT NULL THEN
    RAISE EXCEPTION 'ACTIVE contracts cannot have a termination_reason';
  END IF;

  -- Ensure ACTIVE contracts don't have termination_description
  IF NEW.status = 'ACTIVE' AND NEW.termination_description IS NOT NULL THEN
    RAISE EXCEPTION 'ACTIVE contracts cannot have a termination_description';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
