-- Drop all inventory-related functions
DROP FUNCTION IF EXISTS handle_inventory_movement;
DROP FUNCTION IF EXISTS update_inventory_quantity;

-- Drop all inventory-related tables
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS inventory_items;

-- Drop all inventory-related indexes
DROP INDEX IF EXISTS inventory_items_name_idx;
DROP INDEX IF EXISTS inventory_items_quantity_idx;
DROP INDEX IF EXISTS inventory_movements_item_id_idx;
DROP INDEX IF EXISTS inventory_movements_created_at_idx;

-- Remove ingredients from menu_items
ALTER TABLE menu_items
  DROP COLUMN IF EXISTS ingredients;