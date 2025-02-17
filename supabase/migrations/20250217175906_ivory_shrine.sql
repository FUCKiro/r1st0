/*
  # Fix order total calculation

  1. Changes
    - Add function to calculate order total
    - Add trigger to update total when items are added/modified
    - Fix order items table structure
  
  2. Security
    - Maintain existing RLS policies
*/

-- Function to calculate order total
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
  JOIN menu_items mi ON mi.id = oi.menu_item_id
  WHERE oi.order_id = p_order_id
  AND oi.status != 'cancelled';

  -- Update the order's total
  UPDATE orders
  SET 
    total_amount = v_total,
    updated_at = now()
  WHERE id = p_order_id;

  RETURN v_total;
END;
$$;

-- Trigger function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate and update total for the affected order
  PERFORM calculate_order_total(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.order_id
      ELSE NEW.order_id
    END
  );
  
  RETURN NULL;
END;
$$;

-- Create trigger to update total when items change
DROP TRIGGER IF EXISTS update_order_total_on_items ON order_items;
CREATE TRIGGER update_order_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- Function to initialize order total
CREATE OR REPLACE FUNCTION initialize_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set initial total to 0
  NEW.total_amount := 0;
  RETURN NEW;
END;
$$;

-- Create trigger to initialize total for new orders
DROP TRIGGER IF EXISTS initialize_order_total_on_insert ON orders;
CREATE TRIGGER initialize_order_total_on_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION initialize_order_total();