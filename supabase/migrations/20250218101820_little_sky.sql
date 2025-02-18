/*
  # Fix Menu Structure

  1. Changes
    - Add missing indexes
    - Update constraints
    - Simplify menu structure
*/

-- Add missing indexes
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_items_is_available_idx ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS menu_categories_order_idx ON menu_categories("order");
CREATE INDEX IF NOT EXISTS menu_categories_is_active_idx ON menu_categories(is_active);

-- Update menu_items constraints
ALTER TABLE menu_items
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN category_id SET NOT NULL,
  ALTER COLUMN is_available SET NOT NULL,
  ALTER COLUMN is_vegetarian SET NOT NULL,
  ALTER COLUMN is_vegan SET NOT NULL,
  ALTER COLUMN is_gluten_free SET NOT NULL,
  ALTER COLUMN spiciness_level SET NOT NULL,
  ALTER COLUMN allergens SET DEFAULT '{}',
  ALTER COLUMN ingredients SET DEFAULT '{}';

-- Add check constraints
ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_price_check CHECK (price >= 0),
  ADD CONSTRAINT menu_items_spiciness_check CHECK (spiciness_level BETWEEN 0 AND 3);