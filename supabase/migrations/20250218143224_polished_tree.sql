-- Add check constraints for inventory items
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_quantity_check,
  ADD CONSTRAINT inventory_items_quantity_check CHECK (quantity >= 0),
  DROP CONSTRAINT IF EXISTS inventory_items_minimum_quantity_check,
  ADD CONSTRAINT inventory_items_minimum_quantity_check CHECK (minimum_quantity >= 0);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON inventory_items(name);
CREATE INDEX IF NOT EXISTS inventory_items_quantity_idx ON inventory_items(quantity);
CREATE INDEX IF NOT EXISTS inventory_movements_item_id_idx ON inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS inventory_movements_created_at_idx ON inventory_movements(created_at);