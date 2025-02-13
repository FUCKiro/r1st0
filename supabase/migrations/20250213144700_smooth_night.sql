/*
  # Order Management Functions and Triggers
  
  1. Functions
    - calculate_order_total: Calculates the total amount for an order
    - update_order_total: Trigger function to update order totals
    - update_order_status: Trigger function to update order status
  
  2. Triggers
    - update_order_total_on_items: Updates order total when items change
    - update_order_status_on_items: Updates order status when items change
*/

-- Funzione per calcolare il totale dell'ordine
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id integer)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total decimal;
BEGIN
  SELECT COALESCE(SUM(mi.price * oi.quantity), 0)
  INTO v_total
  FROM order_items oi
  JOIN menu_items mi ON mi.id = oi.product_id
  WHERE oi.order_id = p_order_id
  AND oi.status != 'cancelled';

  RETURN v_total;
END;
$$;

-- Trigger per aggiornare il totale dell'ordine
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Aggiorna il totale dell'ordine
  UPDATE orders
  SET 
    total_amount = calculate_order_total(
      CASE
        WHEN TG_OP = 'DELETE' THEN OLD.order_id
        ELSE NEW.order_id
      END
    ),
    updated_at = now()
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.order_id
    ELSE NEW.order_id
  END;
  
  RETURN NULL;
END;
$$;

-- Trigger per aggiornare il totale quando vengono modificati gli elementi dell'ordine
CREATE TRIGGER update_order_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- Trigger per aggiornare lo stato dell'ordine in base agli elementi
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_all_ready boolean;
  v_all_served boolean;
  v_has_pending boolean;
  v_has_preparing boolean;
  v_total_items integer;
  v_ready_items integer;
  v_served_items integer;
  v_pending_items integer;
  v_preparing_items integer;
BEGIN
  -- Conta gli elementi per ogni stato
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'ready'),
    COUNT(*) FILTER (WHERE status = 'served'),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'preparing')
  INTO
    v_total_items,
    v_ready_items,
    v_served_items,
    v_pending_items,
    v_preparing_items
  FROM order_items
  WHERE order_id = NEW.order_id
  AND status != 'cancelled';

  -- Calcola gli stati aggregati
  v_all_ready := v_total_items > 0 AND v_ready_items = v_total_items;
  v_all_served := v_total_items > 0 AND v_served_items = v_total_items;
  v_has_pending := v_pending_items > 0;
  v_has_preparing := v_preparing_items > 0;

  -- Aggiorna lo stato dell'ordine in base agli elementi
  IF v_all_served THEN
    UPDATE orders SET status = 'served', updated_at = now()
    WHERE id = NEW.order_id AND status != 'paid' AND status != 'cancelled';
  ELSIF v_all_ready THEN
    UPDATE orders SET status = 'ready', updated_at = now()
    WHERE id = NEW.order_id AND status != 'served' AND status != 'paid' AND status != 'cancelled';
  ELSIF v_has_preparing THEN
    UPDATE orders SET status = 'preparing', updated_at = now()
    WHERE id = NEW.order_id AND status != 'ready' AND status != 'served' AND status != 'paid' AND status != 'cancelled';
  ELSIF v_has_pending THEN
    UPDATE orders SET status = 'pending', updated_at = now()
    WHERE id = NEW.order_id AND status != 'preparing' AND status != 'ready' AND status != 'served' AND status != 'paid' AND status != 'cancelled';
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger per aggiornare lo stato dell'ordine quando cambiano gli elementi
CREATE TRIGGER update_order_status_on_items
  AFTER UPDATE OF status ON order_items
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION update_order_status();