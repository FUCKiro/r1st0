/*
  # Fix table position constraints

  1. Changes
    - Make x_position and y_position NOT NULL with default values
    - Add check constraints to ensure positions are within reasonable bounds
    
  2. Data Migration
    - Set default positions for any NULL values
*/

-- Set default values for any existing NULL positions
UPDATE tables 
SET 
  x_position = COALESCE(x_position, 0),
  y_position = COALESCE(y_position, 0)
WHERE x_position IS NULL OR y_position IS NULL;

-- Modify columns to be NOT NULL with defaults and add check constraints
ALTER TABLE tables
  ALTER COLUMN x_position SET NOT NULL,
  ALTER COLUMN x_position SET DEFAULT 0,
  ALTER COLUMN y_position SET NOT NULL,
  ALTER COLUMN y_position SET DEFAULT 0,
  ADD CONSTRAINT check_x_position CHECK (x_position >= 0),
  ADD CONSTRAINT check_y_position CHECK (y_position >= 0);