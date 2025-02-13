/*
  # Aggiunge categorie e piatti di esempio al menu

  1. Categorie
    - Antipasti
    - Primi piatti
    - Secondi piatti
    - Pizze
    - Contorni
    - Dolci
    - Bevande

  2. Piatti con ingredienti collegati al magazzino
*/

-- Categorie menu
INSERT INTO menu_categories (name, description, "order", is_active) VALUES
  ('Antipasti', 'Selezione di antipasti della casa', 1, true),
  ('Primi Piatti', 'Pasta fresca e risotti', 2, true),
  ('Secondi Piatti', 'Carne e pesce', 3, true),
  ('Pizze', 'Pizze tradizionali e speciali', 4, true),
  ('Contorni', 'Verdure e contorni', 5, true),
  ('Dolci', 'Dessert fatti in casa', 6, true),
  ('Bevande', 'Vini, cocktail e bibite', 7, true);

-- Piatti del menu
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  preparation_time,
  allergens,
  ingredients,
  is_vegetarian,
  is_vegan,
  is_gluten_free,
  spiciness_level
) VALUES
  -- Antipasti
  (
    (SELECT id FROM menu_categories WHERE name = 'Antipasti'),
    'Bruschetta al Pomodoro',
    'Pane tostato con pomodorini, aglio e basilico',
    6.50,
    '10 minutes',
    ARRAY['glutine'],
    ARRAY['pane', 'pomodorini', 'aglio', 'basilico', 'olio'],
    true,
    true,
    false,
    0
  ),
  
  -- Primi
  (
    (SELECT id FROM menu_categories WHERE name = 'Primi Piatti'),
    'Spaghetti alle Vongole',
    'Spaghetti con vongole veraci, aglio e prezzemolo',
    14.00,
    '20 minutes',
    ARRAY['glutine', 'molluschi'],
    ARRAY['spaghetti', 'vongole', 'aglio', 'prezzemolo', 'olio'],
    false,
    false,
    false,
    0
  ),
  
  -- Secondi
  (
    (SELECT id FROM menu_categories WHERE name = 'Secondi Piatti'),
    'Pesce Spada alla Griglia',
    'Pesce spada con erbe aromatiche',
    22.00,
    '25 minutes',
    ARRAY['pesce'],
    ARRAY['pesce spada', 'erbe aromatiche', 'olio'],
    false,
    false,
    true,
    0
  ),
  
  -- Pizze
  (
    (SELECT id FROM menu_categories WHERE name = 'Pizze'),
    'Margherita',
    'Pomodoro, mozzarella e basilico',
    9.00,
    '15 minutes',
    ARRAY['glutine', 'lattosio'],
    ARRAY['farina', 'pomodoro', 'mozzarella', 'basilico'],
    true,
    false,
    false,
    0
  );

-- Collega gli ingredienti ai piatti
INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity, unit) VALUES
  -- Bruschetta
  (
    (SELECT id FROM menu_items WHERE name = 'Bruschetta al Pomodoro'),
    (SELECT id FROM inventory_items WHERE name = 'Olio extra vergine'),
    0.02,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Bruschetta al Pomodoro'),
    (SELECT id FROM inventory_items WHERE name = 'Basilico fresco'),
    0.01,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Bruschetta al Pomodoro'),
    (SELECT id FROM inventory_items WHERE name = 'Aglio'),
    0.005,
    'kg'
  ),

  -- Spaghetti alle Vongole
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alle Vongole'),
    (SELECT id FROM inventory_items WHERE name = 'Pasta spaghetti'),
    0.12,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alle Vongole'),
    (SELECT id FROM inventory_items WHERE name = 'Vongole'),
    0.3,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alle Vongole'),
    (SELECT id FROM inventory_items WHERE name = 'Aglio'),
    0.01,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alle Vongole'),
    (SELECT id FROM inventory_items WHERE name = 'Prezzemolo'),
    0.01,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alle Vongole'),
    (SELECT id FROM inventory_items WHERE name = 'Olio extra vergine'),
    0.03,
    'l'
  ),

  -- Pesce Spada
  (
    (SELECT id FROM menu_items WHERE name = 'Pesce Spada alla Griglia'),
    (SELECT id FROM inventory_items WHERE name = 'Pesce spada'),
    0.25,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Pesce Spada alla Griglia'),
    (SELECT id FROM inventory_items WHERE name = 'Olio extra vergine'),
    0.02,
    'l'
  ),

  -- Pizza Margherita
  (
    (SELECT id FROM menu_items WHERE name = 'Margherita'),
    (SELECT id FROM inventory_items WHERE name = 'Farina 00'),
    0.25,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Margherita'),
    (SELECT id FROM inventory_items WHERE name = 'Pomodori pelati'),
    0.15,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Margherita'),
    (SELECT id FROM inventory_items WHERE name = 'Mozzarella'),
    0.2,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Margherita'),
    (SELECT id FROM inventory_items WHERE name = 'Basilico fresco'),
    0.005,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Margherita'),
    (SELECT id FROM inventory_items WHERE name = 'Olio extra vergine'),
    0.02,
    'l'
  );