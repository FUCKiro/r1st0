/*
  # Fix menu inventory types and functions

  1. Changes
    - Add proper type checking for menu inventory functions
    - Fix return types for check_ingredients_availability function
    - Ensure consistent type handling across functions

  2. Functions
    - Modify check_ingredients_availability to return proper types
    - Add type safety to inventory management functions
*/

-- Drop existing function
DROP FUNCTION IF EXISTS check_ingredients_availability(integer);

-- Recreate with proper type handling
CREATE OR REPLACE FUNCTION check_ingredients_availability(p_menu_item_id integer)
RETURNS TABLE (
  ingredient_name text,
  required_quantity decimal,
  available_quantity decimal,
  unit text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.name,
    mii.quantity,
    ii.quantity,
    mii.unit
  FROM menu_item_ingredients mii
  JOIN inventory_items ii ON ii.id = mii.inventory_item_id
  WHERE mii.menu_item_id = p_menu_item_id;
END;
$$;