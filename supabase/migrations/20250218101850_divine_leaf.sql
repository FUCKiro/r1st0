/*
  # Fix Menu Structure

  1. Changes
    - Add missing indexes if they don't exist
    - Update constraints safely with existence checks
*/

-- Add missing indexes if they don't exist
DO $$ 
BEGIN
  -- Check and create indexes for menu_items
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_items_category_id_idx') THEN
    CREATE INDEX menu_items_category_id_idx ON menu_items(category_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_items_is_available_idx') THEN
    CREATE INDEX menu_items_is_available_idx ON menu_items(is_available);
  END IF;

  -- Check and create indexes for menu_categories
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_categories_order_idx') THEN
    CREATE INDEX menu_categories_order_idx ON menu_categories("order");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_categories_is_active_idx') THEN
    CREATE INDEX menu_categories_is_active_idx ON menu_categories(is_active);
  END IF;
END $$;

-- Update menu_items constraints safely
DO $$ 
BEGIN
  -- Set NOT NULL constraints if not already set
  ALTER TABLE menu_items ALTER COLUMN name SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN price SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN category_id SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN is_available SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN is_vegetarian SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN is_vegan SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN is_gluten_free SET NOT NULL;
  ALTER TABLE menu_items ALTER COLUMN spiciness_level SET NOT NULL;

  -- Set default values for array columns
  ALTER TABLE menu_items ALTER COLUMN allergens SET DEFAULT '{}';
  ALTER TABLE menu_items ALTER COLUMN ingredients SET DEFAULT '{}';

  -- Add check constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_spiciness_check'
  ) THEN
    ALTER TABLE menu_items
      ADD CONSTRAINT menu_items_spiciness_check 
      CHECK (spiciness_level BETWEEN 0 AND 3);
  END IF;

  -- Add price check if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_price_positive'
  ) THEN
    ALTER TABLE menu_items
      ADD CONSTRAINT menu_items_price_positive 
      CHECK (price >= 0);
  END IF;

EXCEPTION
  WHEN others THEN
    -- Log error details
    RAISE NOTICE 'Error setting constraints: %', SQLERRM;
END $$;