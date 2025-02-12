/*
  # Update table coordinates to decimal type

  1. Changes
    - Change x_position and y_position columns from integer to decimal(10,2)
    to support precise positioning of tables on the map

  2. Why
    - Integer coordinates are too limiting for smooth drag and drop
    - Decimal values allow for more precise positioning
*/

ALTER TABLE tables 
  ALTER COLUMN x_position TYPE decimal(10,2),
  ALTER COLUMN y_position TYPE decimal(10,2);