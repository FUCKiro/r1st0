/*
  # Inventory Management Schema

  This migration adds inventory management functionality.

  1. New Tables:
    - inventory_items: Track inventory items and their quantities
    - inventory_movements: Track inventory changes (in/out)

  2. Features:
    - Row Level Security (RLS)
    - Automatic timestamp management
    - Quantity validation
    - Movement tracking
*/

-- Inventory items
CREATE TABLE inventory_items (
  id serial PRIMARY KEY,
  name text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL,
  minimum_quantity decimal(10,2) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory items"
  ON inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage inventory items"
  ON inventory_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Inventory movements
CREATE TABLE inventory_movements (
  id serial PRIMARY KEY,
  inventory_item_id integer NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity decimal(10,2) NOT NULL CHECK (quantity > 0),
  type text NOT NULL CHECK (type IN ('in', 'out')),
  notes text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory movements"
  ON inventory_movements FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage inventory movements"
  ON inventory_movements
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Function to update inventory quantity
CREATE OR REPLACE FUNCTION update_inventory_quantity(
  p_item_id integer,
  p_quantity_delta decimal
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_quantity decimal;
  v_new_quantity decimal;
BEGIN
  -- Get current quantity
  SELECT quantity INTO v_current_quantity
  FROM inventory_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- Calculate new quantity
  v_new_quantity := v_current_quantity + p_quantity_delta;

  -- Verify new quantity is not negative
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Quantity cannot be negative';
  END IF;

  -- Update quantity
  UPDATE inventory_items
  SET 
    quantity = v_new_quantity,
    updated_at = now()
  WHERE id = p_item_id;
END;
$$;

-- Trigger for updated_at on inventory_items
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes for better performance
CREATE INDEX inventory_items_minimum_quantity_idx ON inventory_items(minimum_quantity);
CREATE INDEX inventory_movements_item_id_idx ON inventory_movements(inventory_item_id);
CREATE INDEX inventory_movements_created_by_idx ON inventory_movements(created_by);
CREATE INDEX inventory_movements_type_idx ON inventory_movements(type);
CREATE INDEX inventory_movements_created_at_idx ON inventory_movements(created_at);

-- Initial inventory items
INSERT INTO inventory_items (name, quantity, unit, minimum_quantity) VALUES
  -- Basic ingredients
  ('Farina 00', 25.0, 'kg', 10.0),
  ('Pomodori pelati', 30.0, 'kg', 15.0),
  ('Mozzarella', 20.0, 'kg', 8.0),
  ('Olio extra vergine', 15.0, 'l', 5.0),
  ('Sale fino', 10.0, 'kg', 3.0),
  ('Basilico fresco', 2.0, 'kg', 0.5),
  ('Parmigiano Reggiano', 8.0, 'kg', 3.0),
  ('Pasta spaghetti', 20.0, 'kg', 8.0),
  ('Pasta penne', 15.0, 'kg', 8.0),
  ('Riso Carnaroli', 12.0, 'kg', 5.0),
  ('Carne macinata', 15.0, 'kg', 5.0),
  ('Pesce spada', 8.0, 'kg', 3.0),
  ('Vongole', 10.0, 'kg', 4.0),
  ('Patate', 25.0, 'kg', 10.0),
  ('Cipolle', 15.0, 'kg', 5.0),
  ('Aglio', 3.0, 'kg', 1.0),
  ('Prezzemolo', 1.5, 'kg', 0.5),
  ('Pepe nero', 2.0, 'kg', 0.5),
  ('Uova', 200.0, 'pz', 50.0),
  ('Burro', 10.0, 'kg', 3.0),

  -- Beverages
  ('Vino Rosso della Casa', 50.0, 'l', 20.0),
  ('Vino Bianco della Casa', 50.0, 'l', 20.0),
  ('Prosecco', 30.0, 'bottiglie', 10.0),
  ('Champagne', 15.0, 'bottiglie', 5.0),
  
  -- Base liquors for cocktails
  ('Vodka Premium', 8.0, 'l', 3.0),
  ('Gin London Dry', 8.0, 'l', 3.0),
  ('Rum Bianco', 6.0, 'l', 2.0),
  ('Rum Scuro', 6.0, 'l', 2.0),
  ('Tequila', 5.0, 'l', 2.0),
  ('Triple Sec', 4.0, 'l', 1.5),
  ('Vermouth Rosso', 5.0, 'l', 2.0),
  ('Vermouth Bianco', 5.0, 'l', 2.0),
  ('Campari', 4.0, 'l', 1.5),
  ('Aperol', 4.0, 'l', 1.5),
  
  -- Soft drinks and mixers
  ('Coca Cola', 100.0, 'l', 30.0),
  ('Sprite', 50.0, 'l', 15.0),
  ('Fanta', 50.0, 'l', 15.0),
  ('Acqua Tonica', 40.0, 'l', 15.0),
  ('Succo di limone', 10.0, 'l', 3.0),
  ('Succo di arancia', 10.0, 'l', 3.0),
  
  -- Beers
  ('Birra alla spina', 100.0, 'l', 30.0),
  ('Birra artigianale IPA', 30.0, 'bottiglie', 10.0),
  ('Birra artigianale Weiss', 30.0, 'bottiglie', 10.0),
  
  -- Coffee and tea
  ('Caffè in grani', 10.0, 'kg', 3.0),
  ('Latte fresco', 20.0, 'l', 5.0),
  ('Zucchero', 8.0, 'kg', 3.0),
  ('Cacao in polvere', 2.0, 'kg', 0.5),
  ('Tè assortiti', 200.0, 'bustine', 50.0);