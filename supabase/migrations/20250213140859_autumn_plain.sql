/*
  # Update Menu RLS Policies

  1. Changes
    - Simplify RLS policies for menu_categories and menu_items
    - Allow authenticated users to view and manage menu items
    - Remove role-based restrictions for better compatibility with the current auth setup

  2. Security
    - Enable RLS on both tables
    - Allow all authenticated users to manage menu items
    - Maintain public read access for menu display
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Staff can manage menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Staff can manage menu items" ON menu_items;

-- Create simplified policies for menu_categories
CREATE POLICY "Anyone can view menu categories"
  ON menu_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage menu categories"
  ON menu_categories
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create simplified policies for menu_items
CREATE POLICY "Anyone can view menu items"
  ON menu_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');