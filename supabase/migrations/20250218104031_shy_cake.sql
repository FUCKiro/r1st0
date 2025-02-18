/*
  # Simplify Inventory Management

  1. Changes
    - Remove menu item ingredients tracking
    - Keep only general inventory management
    - Simplify inventory movements

  2. Tables Modified
    - inventory_items: Simplified structure
    - inventory_movements: Simplified structure
*/

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS check_menu_item_ingredients(integer, integer);
DROP FUNCTION IF EXISTS update_menu_items_availability();
DROP FUNCTION IF EXISTS log_ingredients_usage(integer, integer, integer);
DROP FUNCTION IF EXISTS trigger_update_menu_items_availability();
DROP FUNCTION IF EXISTS trigger_log_ingredients_usage();

-- Drop existing tables
DROP TABLE IF EXISTS menu_item_ingredients_log;
DROP TABLE IF EXISTS menu_item_ingredients;

-- Simplify inventory_items table
ALTER TABLE inventory_items
  DROP COLUMN IF EXISTS recipe_unit,
  DROP COLUMN IF EXISTS conversion_factor;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON inventory_items(name);
CREATE INDEX IF NOT EXISTS inventory_items_quantity_idx ON inventory_items(quantity);

-- Add check constraints
ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_quantity_check,
  ADD CONSTRAINT inventory_items_quantity_check CHECK (quantity >= 0),
  DROP CONSTRAINT IF EXISTS inventory_items_minimum_quantity_check,
  ADD CONSTRAINT inventory_items_minimum_quantity_check CHECK (minimum_quantity >= 0);

-- Simplify inventory_movements
ALTER TABLE inventory_movements
  DROP COLUMN IF EXISTS recipe_id,
  DROP COLUMN IF EXISTS order_id,
  DROP COLUMN IF EXISTS menu_item_id;