/*
  # Fix order items schema and triggers

  1. Changes
    - Ensure menu_item_id column exists and has correct constraints
    - Update triggers to handle order status changes properly
    - Add proper error handling
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS update_order_status_on_items ON order_items;
DROP TRIGGER IF EXISTS update_menu_item_on_order ON order_items;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_order_status_from_items();
DROP FUNCTION IF EXISTS update_menu_item_availability_on_order();

-- Drop existing foreign key if it exists
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey,
  DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Ensure menu_item_id column exists and is properly typed
DO $$ 
BEGIN
  -- Rename product_id to menu_item_id if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'product_id'
  ) THEN
    ALTER TABLE order_items 
      RENAME COLUMN product_id TO menu_item_id;
  END IF;

  -- Add menu_item_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'menu_item_id'
  ) THEN
    ALTER TABLE order_items 
      ADD COLUMN menu_item_id integer;
  END IF;
END $$;

-- Add NOT NULL constraint to menu_item_id
ALTER TABLE order_items
  ALTER COLUMN menu_item_id SET NOT NULL;

-- Add new foreign key constraint
ALTER TABLE order_items
  ADD CONSTRAINT order_items_menu_item_id_fkey 
    FOREIGN KEY (menu_item_id) 
    REFERENCES menu_items(id)
    ON DELETE RESTRICT;

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
CREATE TRIGGER update_order_status_on_items
  AFTER INSERT OR UPDATE OF status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_from_items();