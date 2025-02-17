/*
  # Menu Item Ingredients Management

  1. New Tables
    - `menu_item_ingredients_log` - Tracks ingredient usage history
      - `id` (serial, primary key)
      - `menu_item_id` (references menu_items)
      - `inventory_item_id` (references inventory_items) 
      - `quantity_used` (decimal)
      - `order_id` (references orders)
      - `created_at` (timestamptz)

  2. Functions
    - `check_menu_item_ingredients` - Checks if all ingredients for a menu item are available
    - `update_menu_items_availability` - Updates availability status of menu items based on ingredients
    - `log_ingredients_usage` - Logs ingredient usage when an order is placed

  3. Triggers
    - Automatically update menu item availability when inventory changes
    - Log ingredient usage when orders are placed
*/

-- Create menu item ingredients log table
CREATE TABLE menu_item_ingredients_log (
  id serial PRIMARY KEY,
  menu_item_id integer REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id integer REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_used decimal(10,3) NOT NULL CHECK (quantity_used > 0),
  order_id integer REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_item_ingredients_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view ingredients log"
  ON menu_item_ingredients_log
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert ingredients log"
  ON menu_item_ingredients_log
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function to check if a menu item has enough ingredients
CREATE OR REPLACE FUNCTION check_menu_item_ingredients(
  p_menu_item_id integer,
  p_quantity integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_enough boolean;
BEGIN
  SELECT bool_and(ii.quantity >= (mii.quantity * p_quantity))
  INTO v_has_enough
  FROM menu_item_ingredients mii
  JOIN inventory_items ii ON ii.id = mii.inventory_item_id
  WHERE mii.menu_item_id = p_menu_item_id;

  RETURN COALESCE(v_has_enough, true);
END;
$$;

-- Function to update menu items availability
CREATE OR REPLACE FUNCTION update_menu_items_availability()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_menu_item record;
BEGIN
  FOR v_menu_item IN SELECT id FROM menu_items
  LOOP
    UPDATE menu_items
    SET 
      is_available = check_menu_item_ingredients(id),
      updated_at = now()
    WHERE id = v_menu_item.id;
  END LOOP;
END;
$$;

-- Function to log ingredient usage
CREATE OR REPLACE FUNCTION log_ingredients_usage(
  p_menu_item_id integer,
  p_order_id integer,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if enough ingredients are available
  IF NOT check_menu_item_ingredients(p_menu_item_id, p_quantity) THEN
    RAISE EXCEPTION 'Ingredienti insufficienti per il piatto';
  END IF;

  -- Log ingredient usage and update inventory
  INSERT INTO menu_item_ingredients_log (
    menu_item_id,
    inventory_item_id,
    quantity_used,
    order_id
  )
  SELECT
    mii.menu_item_id,
    mii.inventory_item_id,
    mii.quantity * p_quantity,
    p_order_id
  FROM menu_item_ingredients mii
  WHERE mii.menu_item_id = p_menu_item_id;

  -- Update inventory quantities
  UPDATE inventory_items ii
  SET 
    quantity = ii.quantity - (mii.quantity * p_quantity),
    updated_at = now()
  FROM menu_item_ingredients mii
  WHERE mii.menu_item_id = p_menu_item_id
  AND ii.id = mii.inventory_item_id;
END;
$$;

-- Trigger to update menu items availability when inventory changes
CREATE OR REPLACE FUNCTION trigger_update_menu_items_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM update_menu_items_availability();
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_menu_items_on_inventory_change
  AFTER UPDATE OF quantity ON inventory_items
  FOR EACH ROW
  WHEN (NEW.quantity != OLD.quantity)
  EXECUTE FUNCTION trigger_update_menu_items_availability();

-- Trigger to log ingredient usage when order items are created
CREATE OR REPLACE FUNCTION trigger_log_ingredients_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process non-cancelled items
  IF NEW.status != 'cancelled' THEN
    PERFORM log_ingredients_usage(
      NEW.menu_item_id,
      NEW.order_id,
      NEW.quantity
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_ingredients_on_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_ingredients_usage();