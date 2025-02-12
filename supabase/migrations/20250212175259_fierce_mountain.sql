/*
  # Fix inventory RLS policies

  1. Changes
    - Drop and recreate RLS policies for inventory_items
    - Drop and recreate RLS policies for inventory_movements
    - Add proper authentication checks

  2. Security
    - All authenticated users can view inventory items
    - Only managers and chefs can modify inventory items
    - All authenticated users can record movements
    - Only managers can modify/delete movements
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers and chefs can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers and chefs can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers and chefs can delete inventory items" ON inventory_items;

-- Create new policies for inventory_items
CREATE POLICY "Authenticated users can view inventory items"
  ON inventory_items FOR SELECT
  USING (auth.role() = 'authenticated');

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

-- Drop existing policies for inventory_movements
DROP POLICY IF EXISTS "Staff can view inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Staff can insert inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Managers can update inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Managers can delete inventory movements" ON inventory_movements;

-- Create new policies for inventory_movements
CREATE POLICY "Authenticated users can view inventory movements"
  ON inventory_movements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

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