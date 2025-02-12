/*
  # Aggiornamento politiche RLS per l'inventario

  1. Modifiche
    - Aggiorna le politiche esistenti per inventory_items
    - Aggiunge nuove politiche per inventory_movements

  2. Sicurezza
    - Tutto lo staff può visualizzare l'inventario
    - Solo manager e chef possono modificare l'inventario
    - Tutto lo staff può registrare movimenti
*/

-- Aggiorna le politiche per inventory_items
DROP POLICY IF EXISTS "Staff can view inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers can delete inventory items" ON inventory_items;

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

-- Aggiorna le politiche per inventory_movements
DROP POLICY IF EXISTS "Staff can view inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Staff can insert inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Managers can update inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Managers can delete inventory movements" ON inventory_movements;

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