/*
  # Fix policies for tables and orders

  1. Changes
    - Simplify policies for tables and orders
    - Allow authenticated users to manage tables and orders
    - Remove role-based restrictions temporarily
*/

-- Drop existing policies for tables
DROP POLICY IF EXISTS "Authenticated users can view tables" ON tables;
DROP POLICY IF EXISTS "Staff can insert tables" ON tables;
DROP POLICY IF EXISTS "Staff can update tables" ON tables;
DROP POLICY IF EXISTS "Staff can delete tables" ON tables;

-- Create simplified policies for tables
CREATE POLICY "Authenticated users can manage tables"
  ON tables
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Drop existing policies for orders
DROP POLICY IF EXISTS "Staff can view orders" ON orders;
DROP POLICY IF EXISTS "Waiters can insert orders" ON orders;
DROP POLICY IF EXISTS "Staff can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can delete orders" ON orders;

-- Create simplified policies for orders
CREATE POLICY "Authenticated users can manage orders"
  ON orders
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Drop existing policies for order_items
DROP POLICY IF EXISTS "Staff can view order items" ON order_items;
DROP POLICY IF EXISTS "Staff can insert order items" ON order_items;
DROP POLICY IF EXISTS "Staff can update order items" ON order_items;
DROP POLICY IF EXISTS "Staff can delete order items" ON order_items;

-- Create simplified policies for order_items
CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');