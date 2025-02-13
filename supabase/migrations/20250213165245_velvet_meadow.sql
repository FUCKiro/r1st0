/*
  # Update roles to Admin, Waiter and Manager only

  1. Changes
    - Update profiles role check constraint to only allow 'admin', 'waiter', 'manager'
    - Update existing roles to match new constraints
*/

-- Aggiorna i ruoli esistenti
UPDATE profiles
SET role = CASE 
  WHEN role IN ('head_waiter', 'trainee_waiter', 'waiter') THEN 'waiter'
  WHEN role IN ('head_chef', 'chef', 'sous_chef', 'head_bartender', 'bartender', 'cashier', 'host', 'kitchen_staff', 'manager') THEN 'manager'
  WHEN role = 'admin' THEN 'admin'
  ELSE 'waiter'
END;

-- Aggiorna il vincolo dei ruoli
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'waiter', 'manager'));