-- Funzione per verificare la disponibilità degli ingredienti di un piatto
CREATE OR REPLACE FUNCTION check_ingredients_availability(p_menu_item_id integer)
RETURNS TABLE (
  ingredient_name text,
  required_quantity decimal,
  available_quantity decimal,
  unit text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.name as ingredient_name,
    mii.quantity as required_quantity,
    ii.quantity as available_quantity,
    mii.unit
  FROM menu_item_ingredients mii
  JOIN inventory_items ii ON ii.id = mii.inventory_item_id
  WHERE mii.menu_item_id = p_menu_item_id;
END;
$$;

-- Funzione per aggiornare la disponibilità di tutti i piatti
CREATE OR REPLACE FUNCTION update_all_menu_items_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_menu_item record;
  v_is_available boolean;
BEGIN
  FOR v_menu_item IN SELECT id FROM menu_items
  LOOP
    -- Verifica se tutti gli ingredienti sono disponibili
    SELECT bool_and(ii.quantity >= mii.quantity)
    INTO v_is_available
    FROM menu_item_ingredients mii
    JOIN inventory_items ii ON ii.id = mii.inventory_item_id
    WHERE mii.menu_item_id = v_menu_item.id;

    -- Aggiorna lo stato del piatto
    UPDATE menu_items
    SET 
      is_available = COALESCE(v_is_available, true),
      updated_at = now()
    WHERE id = v_menu_item.id;
  END LOOP;
END;
$$;