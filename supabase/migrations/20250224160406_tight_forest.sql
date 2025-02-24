/*
  # Update weight-based pricing constraints

  1. Changes
    - Remove min_weight_kg and max_weight_kg columns
    - Update weight-based pricing check constraint to only require price_per_kg
    - Update order_items weight check constraint
*/

-- Drop the old constraint
ALTER TABLE menu_items
DROP CONSTRAINT weight_based_pricing_check;

-- Drop unused columns
ALTER TABLE menu_items
DROP COLUMN min_weight_kg,
DROP COLUMN max_weight_kg;

-- Add new simplified constraint
ALTER TABLE menu_items
ADD CONSTRAINT weight_based_pricing_check 
  CHECK (
    (is_weight_based = false) OR 
    (
      is_weight_based = true AND 
      price_per_kg IS NOT NULL AND 
      price_per_kg > 0
    )
  );

-- Update the order_items constraint to be more permissive
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS weight_based_items_check;

ALTER TABLE order_items
ADD CONSTRAINT weight_based_items_check
  CHECK (
    weight_kg IS NULL OR 
    weight_kg > 0
  );