/*
  # Fix menu inventory types

  1. Changes
    - Fix return types for check_ingredients_availability function
    - Add proper type safety for ingredient availability checks

  2. Functions
    - Modify check_ingredients_availability to return proper decimal types
*/

-- Drop existing function
DROP FUNCTION IF EXISTS check_ingredients_availability(integer);

-- Recreate with proper type handling
CREATE OR REPLACE FUNCTION check_ingredients_availability(p_menu_item_id integer)
RETURNS TABLE (
  ingredient_name text,
  required_quantity numeric,
  available_quantity numeric,
  unit text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.name,
    mii.quantity::numeric,
    ii.quantity::numeric,
    mii.unit
  FROM menu_item_ingredients mii
  JOIN inventory_items ii ON ii.id = mii.inventory_item_id
  WHERE mii.menu_item_id = p_menu_item_id;
END;
$$;