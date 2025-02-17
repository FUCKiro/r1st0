/*
  # Fix order items schema

  1. Changes
    - Rename product_id to menu_item_id in order_items table
    - Update foreign key constraint
    - Add trigger to update menu item availability
  
  2. Security
    - Maintain existing RLS policies
*/

-- Rename product_id to menu_item_id if it hasn't been renamed yet
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'product_id'
  ) THEN
    ALTER TABLE order_items 
      RENAME COLUMN product_id TO menu_item_id;
  END IF;
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey,
  DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Add new foreign key constraint
ALTER TABLE order_items
  ADD CONSTRAINT order_items_menu_item_id_fkey 
    FOREIGN KEY (menu_item_id) 
    REFERENCES menu_items(id)
    ON DELETE RESTRICT;

-- Create trigger to update menu item availability when order is created
CREATE OR REPLACE FUNCTION update_menu_item_availability_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update menu item availability
  UPDATE menu_items
  SET is_available = check_menu_item_ingredients(NEW.menu_item_id)
  WHERE id = NEW.menu_item_id;
  
  RETURN NEW;
END;
$$;

-- Add trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_menu_item_on_order ON order_items;
CREATE TRIGGER update_menu_item_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_item_availability_on_order();