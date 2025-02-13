/*
  # Add trigger for calculating order total on insert
  
  1. Changes
    - Add trigger to calculate order total when a new order is created
    - Add trigger to update order total when order items are inserted
*/

-- Trigger per calcolare il totale quando viene creato un nuovo ordine
CREATE OR REPLACE FUNCTION initialize_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calcola e imposta il totale iniziale
  NEW.total_amount := calculate_order_total(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger che si attiva prima dell'inserimento di un nuovo ordine
CREATE TRIGGER calculate_initial_order_total
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION initialize_order_total();

-- Aggiorna il trigger esistente per gli order_items per gestire anche gli inserimenti
DROP TRIGGER IF EXISTS update_order_total_on_items ON order_items;

CREATE TRIGGER update_order_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();