/*
  # Aggiunge cocktail al menu

  1. Cocktail classici
    - Negroni
    - Mojito
    - Margarita
    - Moscow Mule
    - Aperol Spritz

  2. Collegamenti con gli ingredienti del bar
*/

-- Inserimento cocktail nel menu
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  preparation_time,
  ingredients,
  is_available,
  is_vegetarian,
  is_vegan,
  is_gluten_free
) VALUES
  -- Negroni
  (
    (SELECT id FROM menu_categories WHERE name = 'Bevande'),
    'Negroni',
    'Gin, Vermouth Rosso, Campari',
    9.00,
    '5 minutes',
    ARRAY['gin', 'vermouth rosso', 'campari'],
    true,
    true,
    true,
    true
  ),
  
  -- Mojito
  (
    (SELECT id FROM menu_categories WHERE name = 'Bevande'),
    'Mojito',
    'Rum bianco, lime, menta, zucchero, soda',
    8.00,
    '8 minutes',
    ARRAY['rum bianco', 'lime', 'menta', 'zucchero', 'soda'],
    true,
    true,
    true,
    true
  ),
  
  -- Margarita
  (
    (SELECT id FROM menu_categories WHERE name = 'Bevande'),
    'Margarita',
    'Tequila, Triple Sec, succo di lime',
    8.50,
    '5 minutes',
    ARRAY['tequila', 'triple sec', 'lime'],
    true,
    true,
    true,
    true
  ),
  
  -- Moscow Mule
  (
    (SELECT id FROM menu_categories WHERE name = 'Bevande'),
    'Moscow Mule',
    'Vodka, ginger beer, succo di lime',
    9.00,
    '5 minutes',
    ARRAY['vodka', 'ginger beer', 'lime'],
    true,
    true,
    true,
    true
  ),
  
  -- Aperol Spritz
  (
    (SELECT id FROM menu_categories WHERE name = 'Bevande'),
    'Aperol Spritz',
    'Aperol, Prosecco, soda',
    7.50,
    '5 minutes',
    ARRAY['aperol', 'prosecco', 'soda'],
    true,
    true,
    true,
    true
  );

-- Collega gli ingredienti ai cocktail
INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity, unit) VALUES
  -- Negroni
  (
    (SELECT id FROM menu_items WHERE name = 'Negroni'),
    (SELECT id FROM inventory_items WHERE name = 'Gin London Dry'),
    0.03,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Negroni'),
    (SELECT id FROM inventory_items WHERE name = 'Vermouth Rosso'),
    0.03,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Negroni'),
    (SELECT id FROM inventory_items WHERE name = 'Campari'),
    0.03,
    'l'
  ),

  -- Mojito
  (
    (SELECT id FROM menu_items WHERE name = 'Mojito'),
    (SELECT id FROM inventory_items WHERE name = 'Rum Bianco'),
    0.06,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Mojito'),
    (SELECT id FROM inventory_items WHERE name = 'Succo di limone'),
    0.02,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Mojito'),
    (SELECT id FROM inventory_items WHERE name = 'Zucchero'),
    0.015,
    'kg'
  ),

  -- Margarita
  (
    (SELECT id FROM menu_items WHERE name = 'Margarita'),
    (SELECT id FROM inventory_items WHERE name = 'Tequila'),
    0.05,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Margarita'),
    (SELECT id FROM inventory_items WHERE name = 'Triple Sec'),
    0.02,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Margarita'),
    (SELECT id FROM inventory_items WHERE name = 'Succo di limone'),
    0.02,
    'l'
  ),

  -- Moscow Mule
  (
    (SELECT id FROM menu_items WHERE name = 'Moscow Mule'),
    (SELECT id FROM inventory_items WHERE name = 'Vodka Premium'),
    0.045,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Moscow Mule'),
    (SELECT id FROM inventory_items WHERE name = 'Succo di limone'),
    0.015,
    'l'
  ),

  -- Aperol Spritz
  (
    (SELECT id FROM menu_items WHERE name = 'Aperol Spritz'),
    (SELECT id FROM inventory_items WHERE name = 'Aperol'),
    0.06,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Aperol Spritz'),
    (SELECT id FROM inventory_items WHERE name = 'Prosecco'),
    0.09,
    'l'
  );