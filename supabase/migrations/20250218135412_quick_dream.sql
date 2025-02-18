-- Drop existing function
DROP FUNCTION IF EXISTS handle_inventory_movement;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Authenticated users can manage inventory movements" ON inventory_movements;

-- Create new simplified RLS policy for inventory movements
CREATE POLICY "Anyone can view inventory movements"
  ON inventory_movements
  FOR SELECT
  USING (true);

-- Add check constraints for inventory items
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_quantity_check,
  ADD CONSTRAINT inventory_items_quantity_check CHECK (quantity >= 0),
  DROP CONSTRAINT IF EXISTS inventory_items_minimum_quantity_check,
  ADD CONSTRAINT inventory_items_minimum_quantity_check CHECK (minimum_quantity >= 0);