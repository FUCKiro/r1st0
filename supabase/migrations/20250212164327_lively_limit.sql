/*
  # Enhance tables management

  1. Changes
    - Add notes field for table-specific information
    - Add location field for table position
    - Add last_occupied_at for timing tracking
    - Add merged_with for table merging functionality
    - Add coordinates for table mapping
    - Add reservation fields

  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to tables
ALTER TABLE tables
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS last_occupied_at timestamptz,
ADD COLUMN IF NOT EXISTS merged_with integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS x_position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS y_position integer DEFAULT 0;

-- Add reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id serial PRIMARY KEY,
  table_id integer REFERENCES tables(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  guests integer NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  duration interval DEFAULT '2 hours'::interval,
  notes text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for reservations
CREATE POLICY "Staff can view reservations"
  ON reservations FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert reservations"
  ON reservations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

CREATE POLICY "Staff can update reservations"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

CREATE POLICY "Staff can delete reservations"
  ON reservations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('waiter', 'manager')
    )
  );

-- Add trigger for reservations updated_at
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();