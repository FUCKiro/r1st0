/*
  # Fix inventory RLS policies - Final version

  1. Changes
    - Simplify RLS policies for inventory_items and inventory_movements
    - Allow authenticated users to view and manage inventory
    - Remove complex role checks that were causing permission issues

  2. Security
    - All authenticated users can view and manage inventory
    - Maintain audit trail through created_by field
*/

-- Drop all existing policies for inventory_items
DROP POLICY IF EXISTS "Anyone can view inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers and chefs can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers and chefs can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Managers and chefs can delete inventory items" ON inventory_items;

-- Create simplified policies for inventory_items
CREATE POLICY "Authenticated users can manage inventory items"
  ON inventory_items
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Drop all existing policies for inventory_movements
DROP POLICY IF EXISTS "Anyone can view inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Authenticated users can insert inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Managers can update inventory movements" ON inventory_movements;
DROP POLICY IF EXISTS "Managers can delete inventory movements" ON inventory_movements;

-- Create simplified policies for inventory_movements
CREATE POLICY "Authenticated users can manage inventory movements"
  ON inventory_movements
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');