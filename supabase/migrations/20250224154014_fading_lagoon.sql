/*
  # Add weight-based pricing support

  1. Changes to menu_items table
    - Add `is_weight_based` boolean field
    - Add `price_per_kg` decimal field
    - Add `min_weight_kg` decimal field
    - Add `max_weight_kg` decimal field

  2. Changes to order_items table
    - Add `weight_kg` decimal field for weight-based items

  3. Update order total calculation to handle weight-based pricing
*/

-- Add weight-based pricing fields to menu_items
ALTER TABLE menu_items
ADD COLUMN is_weight_based boolean NOT NULL DEFAULT false,
ADD COLUMN price_per_kg decimal(10,2),
ADD COLUMN min_weight_kg decimal(10,3),
ADD COLUMN max_weight_kg decimal(10,3),
ADD CONSTRAINT weight_based_pricing_check 
  CHECK (
    (is_weight_based = false) OR 
    (
      is_weight_based = true AND 
      price_per_kg IS NOT NULL AND 
      price_per_kg > 0 AND
      min_weight_kg IS NOT NULL AND 
      min_weight_kg > 0 AND
      max_weight_kg IS NOT NULL AND 
      max_weight_kg >= min_weight_kg
    )
  );

-- Add weight field to order_items
ALTER TABLE order_items
ADD COLUMN weight_kg decimal(10,3),
ADD CONSTRAINT weight_based_items_check
  CHECK (
    weight_kg IS NULL OR weight_kg > 0
  );

-- Update the calculate_order_total function to handle weight-based items
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id integer)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total decimal;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN mi.is_weight_based THEN 
        mi.price_per_kg * oi.weight_kg * oi.quantity
      ELSE 
        mi.price * oi.quantity
    END
  ), 0)
  INTO v_total
  FROM order_items oi
  JOIN menu_items mi ON mi.id = oi.menu_item_id
  WHERE oi.order_id = p_order_id
  AND oi.status != 'cancelled';

  RETURN v_total;
END;
$$;