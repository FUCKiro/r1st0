/*
  # Menu and Orders Schema

  This migration adds menu and order management functionality.
  It checks for existing tables before creating them.

  1. Tables:
    - menu_categories
    - menu_items
    - orders
    - order_items
    - reservations

  2. Features:
    - Row Level Security (RLS)
    - Automatic timestamp management
    - Order total calculation
    - Order status tracking
*/

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Create tables only if they don't exist
DO $$ 
BEGIN
  -- Menu categories
  IF NOT table_exists('menu_categories') THEN
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
  END IF;

  -- Menu items
  IF NOT table_exists('menu_items') THEN
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
  END IF;

  -- Orders
  IF NOT table_exists('orders') THEN
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
  END IF;

  -- Order items
  IF NOT table_exists('order_items') THEN
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
  END IF;

  -- Reservations
  IF NOT table_exists('reservations') THEN
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
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_categories_updated_at') THEN
    CREATE TRIGGER update_menu_categories_updated_at
      BEFORE UPDATE ON menu_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_items_updated_at') THEN
    CREATE TRIGGER update_menu_items_updated_at
      BEFORE UPDATE ON menu_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_order_items_updated_at') THEN
    CREATE TRIGGER update_order_items_updated_at
      BEFORE UPDATE ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reservations_updated_at') THEN
    CREATE TRIGGER update_reservations_updated_at
      BEFORE UPDATE ON reservations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

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

-- Create triggers for order management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_order_status_on_items') THEN
    CREATE TRIGGER update_order_status_on_items
      AFTER INSERT OR UPDATE OF status ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION update_order_status_from_items();
  END IF;
END $$;

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

-- Create trigger for order total updates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_order_total_on_items') THEN
    CREATE TRIGGER update_order_total_on_items
      AFTER INSERT OR UPDATE OR DELETE ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION update_order_total();
  END IF;
END $$;

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

-- Create trigger to initialize total for new orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'initialize_order_total_on_insert') THEN
    CREATE TRIGGER initialize_order_total_on_insert
      BEFORE INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION initialize_order_total();
  END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_items_category_id_idx') THEN
    CREATE INDEX menu_items_category_id_idx ON menu_items(category_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_items_is_available_idx') THEN
    CREATE INDEX menu_items_is_available_idx ON menu_items(is_available);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_categories_order_idx') THEN
    CREATE INDEX menu_categories_order_idx ON menu_categories("order");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'menu_categories_is_active_idx') THEN
    CREATE INDEX menu_categories_is_active_idx ON menu_categories(is_active);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'order_items_order_id_idx') THEN
    CREATE INDEX order_items_order_id_idx ON order_items(order_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'order_items_menu_item_id_idx') THEN
    CREATE INDEX order_items_menu_item_id_idx ON order_items(menu_item_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'order_items_status_idx') THEN
    CREATE INDEX order_items_status_idx ON order_items(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_table_id_idx') THEN
    CREATE INDEX orders_table_id_idx ON orders(table_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_waiter_id_idx') THEN
    CREATE INDEX orders_waiter_id_idx ON orders(waiter_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_status_idx') THEN
    CREATE INDEX orders_status_idx ON orders(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orders_merged_order_id_idx') THEN
    CREATE INDEX orders_merged_order_id_idx ON orders(merged_order_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reservations_table_id_idx') THEN
    CREATE INDEX reservations_table_id_idx ON reservations(table_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reservations_date_idx') THEN
    CREATE INDEX reservations_date_idx ON reservations(date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reservations_status_idx') THEN
    CREATE INDEX reservations_status_idx ON reservations(status);
  END IF;
END $$;