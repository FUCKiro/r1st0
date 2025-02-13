/*
  # Collega ingredienti del menu al magazzino

  1. Nuove Tabelle
    - `menu_item_ingredients`: Collega piatti e ingredienti con quantità
      - `menu_item_id` (riferimento a menu_items)
      - `inventory_item_id` (riferimento a inventory_items)
      - `quantity` (quantità necessaria per il piatto)
      - `unit` (unità di misura)

  2. Funzioni
    - `check_ingredients_availability`: Verifica disponibilità ingredienti
    - `update_inventory_from_order`: Aggiorna magazzino quando viene ordinato un piatto

  3. Trigger
    - Aggiorna automaticamente lo stato di disponibilità del piatto in base agli ingredienti
*/

-- Tabella per collegare piatti e ingredienti
CREATE TABLE menu_item_ingredients (
  id serial PRIMARY KEY,
  menu_item_id integer REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id integer REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity decimal(10,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(menu_item_id, inventory_item_id)
);

-- Trigger per updated_at
CREATE TRIGGER update_menu_item_ingredients_updated_at
  BEFORE UPDATE ON menu_item_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS per menu_item_ingredients
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu item ingredients"
  ON menu_item_ingredients
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage menu item ingredients"
  ON menu_item_ingredients
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Funzione per verificare la disponibilità degli ingredienti
CREATE OR REPLACE FUNCTION check_ingredients_availability(p_menu_item_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_all_available boolean;
BEGIN
  SELECT bool_and(ii.quantity >= (mii.quantity * CASE 
    WHEN mii.unit = ii.unit THEN 1
    -- Aggiungi qui altre conversioni di unità se necessario
    ELSE NULL -- Genera un errore se le unità non corrispondono
    END))
  INTO v_all_available
  FROM menu_item_ingredients mii
  JOIN inventory_items ii ON ii.id = mii.inventory_item_id
  WHERE mii.menu_item_id = p_menu_item_id;

  RETURN COALESCE(v_all_available, true);
END;
$$;

-- Funzione per aggiornare il magazzino quando viene ordinato un piatto
CREATE OR REPLACE FUNCTION update_inventory_from_order(
  p_menu_item_id integer,
  p_quantity integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ingredient record;
BEGIN
  -- Verifica disponibilità
  IF NOT check_ingredients_availability(p_menu_item_id) THEN
    RAISE EXCEPTION 'Ingredienti non sufficienti per preparare il piatto';
  END IF;

  -- Aggiorna il magazzino per ogni ingrediente
  FOR v_ingredient IN (
    SELECT 
      mii.inventory_item_id,
      mii.quantity * p_quantity as total_quantity,
      mii.unit
    FROM menu_item_ingredients mii
    WHERE mii.menu_item_id = p_menu_item_id
  ) LOOP
    -- Inserisce il movimento di magazzino
    INSERT INTO inventory_movements (
      inventory_item_id,
      quantity,
      type,
      notes
    ) VALUES (
      v_ingredient.inventory_item_id,
      v_ingredient.total_quantity,
      'out',
      format('Utilizzato per ordine piatto ID: %s', p_menu_item_id)
    );

    -- Aggiorna la quantità nell'inventario
    UPDATE inventory_items
    SET quantity = quantity - v_ingredient.total_quantity
    WHERE id = v_ingredient.inventory_item_id;
  END LOOP;
END;
$$;

-- Trigger per aggiornare la disponibilità del piatto
CREATE OR REPLACE FUNCTION update_menu_item_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Aggiorna is_available del piatto in base alla disponibilità degli ingredienti
  UPDATE menu_items
  SET is_available = check_ingredients_availability(id)
  WHERE id = COALESCE(
    NEW.menu_item_id,
    OLD.menu_item_id
  );
  
  RETURN NULL;
END;
$$;

CREATE TRIGGER check_menu_item_availability
  AFTER INSERT OR UPDATE OR DELETE ON menu_item_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_item_availability();

-- Trigger per aggiornare la disponibilità quando cambia la quantità in magazzino
CREATE TRIGGER update_menu_items_availability
  AFTER UPDATE OF quantity ON inventory_items
  FOR EACH ROW
  WHEN (NEW.quantity != OLD.quantity)
  EXECUTE FUNCTION update_menu_item_availability();