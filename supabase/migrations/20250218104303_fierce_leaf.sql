/*
  # Fix Inventory Management

  1. Changes
    - Update inventory quantity function to handle authentication properly
    - Add validation for quantity updates
    - Add proper error handling

  2. Functions Modified
    - update_inventory_quantity: Updated to handle auth context
*/

-- Drop and recreate the function with proper auth handling
CREATE OR REPLACE FUNCTION update_inventory_quantity(
  p_item_id integer,
  p_quantity_delta numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity numeric;
  v_new_quantity numeric;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Verify authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente non autenticato';
  END IF;

  -- Get current quantity
  SELECT quantity INTO v_current_quantity
  FROM inventory_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Articolo non trovato';
  END IF;

  -- Calculate new quantity
  v_new_quantity := v_current_quantity + p_quantity_delta;

  -- Validate new quantity
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'La quantità non può essere negativa';
  END IF;

  -- Update quantity
  UPDATE inventory_items
  SET 
    quantity = v_new_quantity,
    updated_at = now()
  WHERE id = p_item_id;

  -- Create movement record
  INSERT INTO inventory_movements (
    inventory_item_id,
    quantity,
    type,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    ABS(p_quantity_delta),
    CASE WHEN p_quantity_delta > 0 THEN 'in' ELSE 'out' END,
    'Movimento manuale',
    v_user_id
  );
END;
$$;