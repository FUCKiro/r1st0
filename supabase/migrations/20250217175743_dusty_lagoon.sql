/*
  # Fix order items table structure

  1. Changes
    - Ensure order_items table has correct structure
    - Add proper constraints and foreign keys
    - Update triggers for order status management
  
  2. Security
    - Maintain existing RLS policies
*/

-- Recreate order_items table with correct structure
CREATE TABLE IF NOT EXISTS order_items_new (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id integer NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Copy data from old table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    INSERT INTO order_items_new (
      id, order_id, menu_item_id, quantity, notes, status, created_at, updated_at
    )
    SELECT 
      id, 
      order_id, 
      COALESCE(menu_item_id, (SELECT id FROM menu_items LIMIT 1)), -- Fallback to first menu item if null
      quantity, 
      notes, 
      status, 
      created_at, 
      updated_at
    FROM order_items;

    -- Drop old table
    DROP TABLE order_items;
  END IF;
END $$;

-- Rename new table to order_items
ALTER TABLE order_items_new RENAME TO order_items;

-- Add indexes
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_menu_item_id_idx ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS order_items_status_idx ON order_items(status);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to update order status
CREATE OR REPLACE FUNCTION update_order_status_from_items()
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
BEGIN
  -- Count items by status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'ready') = COUNT(*),
    COUNT(*) FILTER (WHERE status = 'served') = COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending') > 0,
    COUNT(*) FILTER (WHERE status = 'preparing') > 0
  INTO
    v_total_items,
    v_all_ready,
    v_all_served,
    v_has_pending,
    v_has_preparing
  FROM order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  AND status != 'cancelled';

  -- Update order status based on items
  IF v_total_items > 0 THEN
    IF v_all_served THEN
      UPDATE orders SET status = 'served', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'paid' 
      AND status != 'cancelled';
    ELSIF v_all_ready THEN
      UPDATE orders SET status = 'ready', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'served' 
      AND status != 'paid' 
      AND status != 'cancelled';
    ELSIF v_has_preparing THEN
      UPDATE orders SET status = 'preparing', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'ready' 
      AND status != 'served' 
      AND status != 'paid' 
      AND status != 'cancelled';
    ELSIF v_has_pending THEN
      UPDATE orders SET status = 'pending', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'preparing' 
      AND status != 'ready' 
      AND status != 'served' 
      AND status != 'paid' 
      AND status != 'cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order status updates
DROP TRIGGER IF EXISTS update_order_status_on_items ON order_items;
CREATE TRIGGER update_order_status_on_items
  AFTER INSERT OR UPDATE OF status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_from_items();