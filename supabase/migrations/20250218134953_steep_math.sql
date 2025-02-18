-- Drop existing function
DROP FUNCTION IF EXISTS handle_inventory_movement;

-- Create new simplified function
CREATE OR REPLACE FUNCTION handle_inventory_movement(
  p_item_id integer,
  p_quantity numeric,
  p_type text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_quantity numeric;
  v_new_quantity numeric;
BEGIN
  -- Input validation
  IF p_item_id IS NULL THEN
    RAISE EXCEPTION 'ID articolo non valido';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La quantità deve essere maggiore di zero';
  END IF;

  IF p_type IS NULL OR p_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'Tipo movimento non valido';
  END IF;

  -- Get current quantity
  SELECT quantity INTO v_current_quantity
  FROM inventory_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Articolo non trovato';
  END IF;

  -- Calculate new quantity
  IF p_type = 'in' THEN
    v_new_quantity := v_current_quantity + p_quantity;
  ELSE -- out
    v_new_quantity := v_current_quantity - p_quantity;
    
    -- Check if enough quantity for outbound movement
    IF v_new_quantity < 0 THEN
      RAISE EXCEPTION 'Quantità insufficiente per lo scarico';
    END IF;
  END IF;

  -- Update inventory
  UPDATE inventory_items
  SET 
    quantity = v_new_quantity,
    updated_at = now()
  WHERE id = p_item_id;

  -- Record movement
  INSERT INTO inventory_movements (
    inventory_item_id,
    quantity,
    type,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    p_quantity,
    p_type,
    COALESCE(p_notes, 'Movimento manuale'),
    auth.uid()
  );
END;
$$;