/*
  # Fix Inventory Management

  1. Changes
    - Update inventory quantity function to handle simple inventory movements
    - Add validation for quantity updates
    - Add proper error handling

  2. Functions Modified
    - update_inventory_quantity: Simplified to handle basic inventory movements
*/

-- Drop and recreate the function with proper error handling
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
BEGIN
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
    notes
  ) VALUES (
    p_item_id,
    ABS(p_quantity_delta),
    CASE WHEN p_quantity_delta > 0 THEN 'in' ELSE 'out' END,
    'Movimento manuale'
  );
END;
$$;