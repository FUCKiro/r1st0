/*
  # Update order items foreign key constraint
  
  1. Changes
    - Modify order_items foreign key to cascade delete when order is deleted
*/

-- Drop existing foreign key constraint
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- Add new constraint with ON DELETE CASCADE
ALTER TABLE order_items
  ADD CONSTRAINT order_items_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES orders(id)
  ON DELETE CASCADE;