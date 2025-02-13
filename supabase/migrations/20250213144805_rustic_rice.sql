/*
  # Fix Order Items Relationship
  
  1. Changes
    - Add menu_item_id column to order_items
    - Rename product_id to menu_item_id for clarity
    - Update foreign key relationship
  
  2. Data Migration
    - Move existing product_id data to menu_item_id
*/

-- Rename product_id to menu_item_id
ALTER TABLE order_items 
  RENAME COLUMN product_id TO menu_item_id;

-- Update foreign key constraint
ALTER TABLE order_items
  DROP CONSTRAINT order_items_product_id_fkey,
  ADD CONSTRAINT order_items_menu_item_id_fkey 
    FOREIGN KEY (menu_item_id) 
    REFERENCES menu_items(id)
    ON DELETE RESTRICT;