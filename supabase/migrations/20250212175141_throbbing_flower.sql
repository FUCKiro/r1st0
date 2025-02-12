/*
  # Politiche RLS per la gestione dell'inventario

  1. Tabelle
    - `inventory_items`: Articoli in magazzino
    - `inventory_movements`: Movimenti di magazzino

  2. Politiche
    - Visualizzazione: Tutto lo staff può vedere l'inventario
    - Modifica: Solo manager e chef possono modificare l'inventario
    - Movimenti: Tutto lo staff può registrare movimenti
*/

-- Abilita RLS per inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Politiche per inventory_items
CREATE POLICY "Staff can view inventory items"
  ON inventory_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

CREATE POLICY "Managers and chefs can insert inventory items"
  ON inventory_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef')
    )
  );

CREATE POLICY "Managers and chefs can update inventory items"
  ON inventory_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef')
    )
  );

CREATE POLICY "Managers and chefs can delete inventory items"
  ON inventory_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'chef')
    )
  );

-- Abilita RLS per inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Politiche per inventory_movements
CREATE POLICY "Staff can view inventory movements"
  ON inventory_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

CREATE POLICY "Staff can insert inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'chef', 'bartender', 'manager')
    )
  );

-- Solo i manager possono modificare o eliminare i movimenti
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