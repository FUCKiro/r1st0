/*
  # Database Schema Update

  This migration adds tables and functionality for menu and orders management,
  skipping the tables that already exist (profiles).

  1. Tables:
    - tables: Restaurant tables management
    - menu_categories: Menu categories
    - menu_items: Menu items/dishes
    - orders: Customer orders
    - order_items: Individual items in orders
    - reservations: Table reservations

  2. Features:
    - Row Level Security (RLS)
    - Automatic timestamp management
    - Order total calculation
    - Order status tracking
*/

-- Tables management
CREATE TABLE tables (
  id serial PRIMARY KEY,
  number integer NOT NULL UNIQUE,
  capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved')),
  notes text,
  location text,
  last_occupied_at timestamptz,
  merged_with integer[] DEFAULT '{}',
  x_position decimal(10,2) NOT NULL DEFAULT 0 CHECK (x_position >= 0),
  y_position decimal(10,2) NOT NULL DEFAULT 0 CHECK (y_position >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tables"
  ON tables
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Menu categories
CREATE TABLE menu_categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu categories"
  ON menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage menu categories"
  ON menu_categories
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Menu items
CREATE TABLE menu_items (
  id serial PRIMARY KEY,
  category_id integer NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  is_available boolean NOT NULL DEFAULT true,
  preparation_time interval,
  allergens text[] DEFAULT '{}',
  image_url text,
  is_vegetarian boolean NOT NULL DEFAULT false,
  is_vegan boolean NOT NULL DEFAULT false,
  is_gluten_free boolean NOT NULL DEFAULT false,
  spiciness_level integer NOT NULL DEFAULT 0 CHECK (spiciness_level BETWEEN 0 AND 3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu items"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Orders
CREATE TABLE orders (
  id serial PRIMARY KEY,
  table_id integer NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
  waiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  notes text,
  merged_order_id integer REFERENCES orders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage orders"
  ON orders
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Order items
CREATE TABLE order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id integer NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Reservations
CREATE TABLE reservations (
  id serial PRIMARY KEY,
  table_id integer REFERENCES tables(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  guests integer NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  duration interval DEFAULT '2 hours'::interval,
  notes text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage reservations"
  ON reservations
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id integer)
RETURNS decimal
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total decimal;
BEGIN
  SELECT COALESCE(SUM(mi.price * oi.quantity), 0)
  INTO v_total
  FROM order_items oi
  JOIN menu_items mi ON mi.id = oi.menu_item_id
  WHERE oi.order_id = p_order_id
  AND oi.status != 'cancelled';

  RETURN v_total;
END;
$$;

-- Function to update order status based on items
CREATE OR REPLACE FUNCTION update_order_status_from_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_all_ready boolean;
  v_all_served boolean;
  v_has_pending boolean;
  v_has_preparing boolean;
  v_total_items integer;
BEGIN
  -- Count items by status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'ready') = COUNT(*),
    COUNT(*) FILTER (WHERE status = 'served') = COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending') > 0,
    COUNT(*) FILTER (WHERE status = 'preparing') > 0
  INTO
    v_total_items,
    v_all_ready,
    v_all_served,
    v_has_pending,
    v_has_preparing
  FROM order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  AND status != 'cancelled';

  -- Update order status based on items
  IF v_total_items > 0 THEN
    IF v_all_served THEN
      UPDATE orders SET status = 'served', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'paid' 
      AND status != 'cancelled';
    ELSIF v_all_ready THEN
      UPDATE orders SET status = 'ready', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'served' 
      AND status != 'paid' 
      AND status != 'cancelled';
    ELSIF v_has_preparing THEN
      UPDATE orders SET status = 'preparing', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'ready' 
      AND status != 'served' 
      AND status != 'paid' 
      AND status != 'cancelled';
    ELSIF v_has_pending THEN
      UPDATE orders SET status = 'pending', updated_at = now()
      WHERE id = COALESCE(NEW.order_id, OLD.order_id)
      AND status != 'preparing' 
      AND status != 'ready' 
      AND status != 'served' 
      AND status != 'paid' 
      AND status != 'cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for order status updates
CREATE TRIGGER update_order_status_on_items
  AFTER INSERT OR UPDATE OF status ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_from_items();

-- Function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate and update total for the affected order
  UPDATE orders
  SET 
    total_amount = calculate_order_total(
      CASE
        WHEN TG_OP = 'DELETE' THEN OLD.order_id
        ELSE NEW.order_id
      END
    ),
    updated_at = now()
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.order_id
    ELSE NEW.order_id
  END;
  
  RETURN NULL;
END;
$$;

-- Trigger for order total updates
CREATE TRIGGER update_order_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- Function to initialize order total
CREATE OR REPLACE FUNCTION initialize_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set initial total to 0
  NEW.total_amount := 0;
  RETURN NEW;
END;
$$;

-- Trigger to initialize total for new orders
CREATE TRIGGER initialize_order_total_on_insert
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION initialize_order_total();

-- Indexes for better performance
CREATE INDEX menu_items_category_id_idx ON menu_items(category_id);
CREATE INDEX menu_items_is_available_idx ON menu_items(is_available);
CREATE INDEX menu_categories_order_idx ON menu_categories("order");
CREATE INDEX menu_categories_is_active_idx ON menu_categories(is_active);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX order_items_menu_item_id_idx ON order_items(menu_item_id);
CREATE INDEX order_items_status_idx ON order_items(status);
CREATE INDEX orders_table_id_idx ON orders(table_id);
CREATE INDEX orders_waiter_id_idx ON orders(waiter_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_merged_order_id_idx ON orders(merged_order_id);
CREATE INDEX reservations_table_id_idx ON reservations(table_id);
CREATE INDEX reservations_date_idx ON reservations(date);
CREATE INDEX reservations_status_idx ON reservations(status);