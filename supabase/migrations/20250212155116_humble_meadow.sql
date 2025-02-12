/*
  # Schema iniziale per l'app di gestione ristorante

  1. Nuove Tabelle
    - `profiles`: Profili utente con ruoli (cameriere, cuoco, manager)
    - `tables`: Tavoli del ristorante
    - `orders`: Ordini dei clienti
    - `order_items`: Elementi degli ordini
    - `products`: Prodotti (piatti e bevande)
    - `categories`: Categorie dei prodotti
    - `inventory_items`: Elementi del magazzino
    - `inventory_movements`: Movimenti del magazzino
    - `bottles`: Gestione bottiglie per il bar

  2. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies per controllo accessi basato sui ruoli
*/

-- Profiles table for user roles and details
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('waiter', 'chef', 'bartender', 'manager')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tables management
CREATE TABLE tables (
  id serial PRIMARY KEY,
  number integer NOT NULL UNIQUE,
  capacity integer NOT NULL,
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied', 'reserved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tables"
  ON tables FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert tables"
  ON tables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

CREATE POLICY "Staff can update tables"
  ON tables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

CREATE POLICY "Staff can delete tables"
  ON tables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

-- Product categories
CREATE TABLE categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('food', 'drink')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Products (food and drinks)
CREATE TABLE products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  category_id integer REFERENCES categories(id),
  is_available boolean DEFAULT true,
  preparation_time interval,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef', 'bartender')
    )
  );

CREATE POLICY "Staff can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef', 'bartender')
    )
  );

CREATE POLICY "Staff can delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef', 'bartender')
    )
  );

-- Orders
CREATE TABLE orders (
  id serial PRIMARY KEY,
  table_id integer REFERENCES tables(id),
  waiter_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'paid', 'cancelled')),
  total_amount decimal(10,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Waiters can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'waiter'
    )
  );

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

CREATE POLICY "Staff can delete orders"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

-- Order items
CREATE TABLE order_items (
  id serial PRIMARY KEY,
  order_id integer REFERENCES orders(id),
  product_id integer REFERENCES products(id),
  quantity integer NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view order items"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

CREATE POLICY "Staff can update order items"
  ON order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

CREATE POLICY "Staff can delete order items"
  ON order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

-- Inventory items
CREATE TABLE inventory_items (
  id serial PRIMARY KEY,
  name text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL,
  minimum_quantity decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inventory"
  ON inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert inventory"
  ON inventory_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can update inventory"
  ON inventory_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete inventory"
  ON inventory_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Inventory movements
CREATE TABLE inventory_movements (
  id serial PRIMARY KEY,
  inventory_item_id integer REFERENCES inventory_items(id),
  quantity decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('in', 'out')),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inventory movements"
  ON inventory_movements FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can update inventory movements"
  ON inventory_movements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can delete inventory movements"
  ON inventory_movements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Bottles management
CREATE TABLE bottles (
  id serial PRIMARY KEY,
  name text NOT NULL,
  brand text,
  type text NOT NULL,
  capacity decimal(10,2) NOT NULL,
  current_quantity decimal(10,2) NOT NULL,
  minimum_quantity decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view bottles"
  ON bottles FOR SELECT
  USING (true);

CREATE POLICY "Bartenders can insert bottles"
  ON bottles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bartender', 'manager')
    )
  );

CREATE POLICY "Bartenders can update bottles"
  ON bottles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bartender', 'manager')
    )
  );

CREATE POLICY "Bartenders can delete bottles"
  ON bottles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bartender', 'manager')
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
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

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bottles_updated_at
  BEFORE UPDATE ON bottles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();