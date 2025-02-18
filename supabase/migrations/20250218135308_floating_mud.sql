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

  -- Update inventory based on movement type
  IF p_type = 'in' THEN
    UPDATE inventory_items
    SET 
      quantity = quantity + p_quantity,
      updated_at = now()
    WHERE id = p_item_id;
  ELSE -- out
    UPDATE inventory_items
    SET 
      quantity = quantity - p_quantity,
      updated_at = now()
    WHERE id = p_item_id
    AND quantity >= p_quantity; -- Ensure enough quantity
  END IF;

  -- Check if item exists and was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Articolo non trovato o quantità insufficiente';
  END IF;

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