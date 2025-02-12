/*
  # Funzioni per la gestione dell'inventario

  1. Funzioni
    - `update_inventory_quantity`: Aggiorna la quantità di un articolo in inventario
      - Parametri:
        - `p_item_id`: ID dell'articolo
        - `p_quantity_delta`: Variazione della quantità (positiva per carico, negativa per scarico)
      - Controlli:
        - Verifica che l'articolo esista
        - Verifica che la quantità finale non sia negativa
      - Aggiornamenti:
        - Aggiorna la quantità dell'articolo
        - Aggiorna il timestamp di modifica
*/

CREATE OR REPLACE FUNCTION update_inventory_quantity(
  p_item_id integer,
  p_quantity_delta decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity decimal;
  v_new_quantity decimal;
BEGIN
  -- Ottieni la quantità corrente
  SELECT quantity INTO v_current_quantity
  FROM inventory_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Articolo non trovato';
  END IF;

  -- Calcola la nuova quantità
  v_new_quantity := v_current_quantity + p_quantity_delta;

  -- Verifica che la nuova quantità non sia negativa
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'La quantità non può essere negativa';
  END IF;

  -- Aggiorna la quantità
  UPDATE inventory_items
  SET 
    quantity = v_new_quantity,
    updated_at = now()
  WHERE id = p_item_id;
END;
$$;