/*
  # Gestione Menu e Categorie

  1. Nuove Tabelle
    - `menu_categories`: Categorie del menu (es. antipasti, primi, etc.)
      - `id` (serial, primary key)
      - `name` (text): Nome categoria
      - `description` (text): Descrizione opzionale
      - `order` (integer): Ordine di visualizzazione
      - `is_active` (boolean): Stato attivo/inattivo
      
    - `menu_items`: Piatti del menu
      - `id` (serial, primary key)
      - `category_id` (integer): Riferimento alla categoria
      - `name` (text): Nome del piatto
      - `description` (text): Descrizione del piatto
      - `price` (decimal): Prezzo
      - `is_available` (boolean): Disponibilità
      - `preparation_time` (interval): Tempo di preparazione stimato
      - `allergens` (text[]): Lista degli allergeni
      - `ingredients` (text[]): Lista degli ingredienti principali
      - `image_url` (text): URL immagine del piatto
      - `is_vegetarian` (boolean): Indicatore piatto vegetariano
      - `is_vegan` (boolean): Indicatore piatto vegano
      - `is_gluten_free` (boolean): Indicatore senza glutine
      - `spiciness_level` (integer): Livello di piccantezza (0-3)
      
  2. Security
    - Enable RLS su entrambe le tabelle
    - Policies per lettura pubblica
    - Policies per gestione riservata allo staff
*/

-- Menu Categories
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

-- Menu Items
CREATE TABLE menu_items (
  id serial PRIMARY KEY,
  category_id integer REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  preparation_time interval,
  allergens text[] DEFAULT '{}',
  ingredients text[] DEFAULT '{}',
  image_url text,
  is_vegetarian boolean NOT NULL DEFAULT false,
  is_vegan boolean NOT NULL DEFAULT false,
  is_gluten_free boolean NOT NULL DEFAULT false,
  spiciness_level integer NOT NULL DEFAULT 0 CHECK (spiciness_level BETWEEN 0 AND 3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies for menu_categories
CREATE POLICY "Anyone can view menu categories"
  ON menu_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage menu categories"
  ON menu_categories
  USING (auth.role() = 'authenticated')
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef')
    )
  );

-- RLS Policies for menu_items
CREATE POLICY "Anyone can view menu items"
  ON menu_items
  FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage menu items"
  ON menu_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef')
    )
  );