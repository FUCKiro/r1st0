/*
  # Rimozione gestione ingredienti dal menu

  1. Rimozione Tabelle
    - Rimuove la tabella menu_item_ingredients
    - Rimuove la tabella menu_item_ingredients_log

  2. Rimozione Funzioni
    - Rimuove le funzioni per la gestione degli ingredienti
    - Rimuove i trigger associati

  3. Pulizia
    - Rimuove gli indici e i vincoli associati
*/

-- Rimuovi i trigger
DROP TRIGGER IF EXISTS update_menu_items_on_inventory_change ON inventory_items;
DROP TRIGGER IF EXISTS log_ingredients_on_order ON order_items;
DROP TRIGGER IF EXISTS update_menu_item_on_order ON order_items;

-- Rimuovi le funzioni
DROP FUNCTION IF EXISTS check_menu_item_ingredients(integer, integer);
DROP FUNCTION IF EXISTS update_menu_items_availability();
DROP FUNCTION IF EXISTS log_ingredients_usage(integer, integer, integer);
DROP FUNCTION IF EXISTS trigger_update_menu_items_availability();
DROP FUNCTION IF EXISTS trigger_log_ingredients_usage();
DROP FUNCTION IF EXISTS update_menu_item_availability_on_order();

-- Rimuovi le tabelle
DROP TABLE IF EXISTS menu_item_ingredients_log;
DROP TABLE IF EXISTS menu_item_ingredients;