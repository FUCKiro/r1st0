/*
  # Fix weight-based pricing calculation

  1. Changes
    - Update calculate_order_total function to handle weight-based items correctly
    - Add trigger to validate weight_kg is present for weight-based items
    - Add trigger to validate price is 0 for weight-based items

  2. Security
    - Maintain existing RLS policies
*/

-- Function to validate weight-based items
CREATE OR REPLACE FUNCTION validate_weight_based_items()
RETURNS trigger AS $$
BEGIN
  -- Check if the menu item is weight-based
  DECLARE
    v_is_weight_based boolean;
  BEGIN
    SELECT is_weight_based INTO v_is_weight_based
    FROM menu_items
    WHERE id = NEW.menu_item_id;

    IF v_is_weight_based THEN
      -- Weight is required for weight-based items
      IF NEW.weight_kg IS NULL THEN
        RAISE EXCEPTION 'Weight is required for weight-based items';
      END IF;
    ELSE
      -- Weight should be NULL for non-weight-based items
      IF NEW.weight_kg IS NOT NULL THEN
        RAISE EXCEPTION 'Weight should not be set for non-weight-based items';
      END IF;
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order_items validation
DROP TRIGGER IF EXISTS validate_weight_based_items_trigger ON order_items;
CREATE TRIGGER validate_weight_based_items_trigger
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_weight_based_items();

-- Function to validate menu item prices
CREATE OR REPLACE FUNCTION validate_menu_item_prices()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_weight_based THEN
    -- Price must be 0 for weight-based items
    NEW.price := 0;
    
    -- Price per kg is required
    IF NEW.price_per_kg IS NULL OR NEW.price_per_kg <= 0 THEN
      RAISE EXCEPTION 'Price per kg is required and must be greater than 0 for weight-based items';
    END IF;
  ELSE
    -- Price per kg must be NULL for non-weight-based items
    NEW.price_per_kg := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for menu_items validation
DROP TRIGGER IF EXISTS validate_menu_item_prices_trigger ON menu_items;
CREATE TRIGGER validate_menu_item_prices_trigger
  BEFORE INSERT OR UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_menu_item_prices();

-- Update the calculate_order_total function
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
        -- For weight-based items: price_per_kg * weight_kg * quantity
        mi.price_per_kg * COALESCE(oi.weight_kg, 0) * oi.quantity
      ELSE 
        -- For regular items: price * quantity
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