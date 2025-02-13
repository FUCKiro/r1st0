/*
  # Aggiunge piatti al menu

  1. Nuovi piatti
    - Primi piatti: pasta e risotti
    - Secondi piatti: carne e pesce
    - Contorni
    - Dolci

  2. Collegamenti con gli ingredienti del magazzino
*/

-- Inserimento piatti nel menu
INSERT INTO menu_items (
  category_id,
  name,
  description,
  price,
  preparation_time,
  allergens,
  ingredients,
  is_available,
  is_vegetarian,
  is_vegan,
  is_gluten_free,
  spiciness_level
) VALUES
  -- Primi Piatti
  (
    (SELECT id FROM menu_categories WHERE name = 'Primi Piatti'),
    'Spaghetti alla Carbonara',
    'Spaghetti con uova, guanciale, pecorino e pepe nero',
    13.00,
    '15 minutes',
    ARRAY['glutine', 'uova', 'lattosio'],
    ARRAY['spaghetti', 'uova', 'guanciale', 'pecorino', 'pepe nero'],
    true,
    false,
    false,
    false,
    0
  ),
  (
    (SELECT id FROM menu_categories WHERE name = 'Primi Piatti'),
    'Risotto ai Funghi',
    'Risotto con funghi porcini e parmigiano',
    14.00,
    '20 minutes',
    ARRAY['lattosio'],
    ARRAY['riso', 'funghi porcini', 'parmigiano', 'burro', 'cipolla'],
    true,
    true,
    false,
    true,
    0
  ),
  
  -- Secondi Piatti
  (
    (SELECT id FROM menu_categories WHERE name = 'Secondi Piatti'),
    'Tagliata di Manzo',
    'Tagliata di manzo con rucola e parmigiano',
    24.00,
    '15 minutes',
    ARRAY['lattosio'],
    ARRAY['manzo', 'rucola', 'parmigiano', 'olio'],
    true,
    false,
    false,
    true,
    0
  ),
  
  -- Contorni
  (
    (SELECT id FROM menu_categories WHERE name = 'Contorni'),
    'Patate al Forno',
    'Patate al forno con rosmarino',
    5.00,
    '25 minutes',
    ARRAY[],
    ARRAY['patate', 'rosmarino', 'olio', 'sale'],
    true,
    true,
    true,
    true,
    0
  ),
  
  -- Dolci
  (
    (SELECT id FROM menu_categories WHERE name = 'Dolci'),
    'Tiramisù',
    'Dolce classico con savoiardi, caffè e mascarpone',
    6.50,
    '0 minutes',
    ARRAY['glutine', 'uova', 'lattosio'],
    ARRAY['savoiardi', 'caffè', 'mascarpone', 'uova', 'cacao'],
    true,
    true,
    false,
    false,
    0
  );

-- Collega gli ingredienti ai piatti
INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity, unit) VALUES
  -- Spaghetti alla Carbonara
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alla Carbonara'),
    (SELECT id FROM inventory_items WHERE name = 'Pasta spaghetti'),
    0.12,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alla Carbonara'),
    (SELECT id FROM inventory_items WHERE name = 'Uova'),
    2,
    'pz'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alla Carbonara'),
    (SELECT id FROM inventory_items WHERE name = 'Parmigiano Reggiano'),
    0.03,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Spaghetti alla Carbonara'),
    (SELECT id FROM inventory_items WHERE name = 'Pepe nero'),
    0.002,
    'kg'
  ),

  -- Risotto ai Funghi
  (
    (SELECT id FROM menu_items WHERE name = 'Risotto ai Funghi'),
    (SELECT id FROM inventory_items WHERE name = 'Riso Carnaroli'),
    0.1,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Risotto ai Funghi'),
    (SELECT id FROM inventory_items WHERE name = 'Parmigiano Reggiano'),
    0.03,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Risotto ai Funghi'),
    (SELECT id FROM inventory_items WHERE name = 'Burro'),
    0.02,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Risotto ai Funghi'),
    (SELECT id FROM inventory_items WHERE name = 'Cipolle'),
    0.03,
    'kg'
  ),

  -- Tagliata di Manzo
  (
    (SELECT id FROM menu_items WHERE name = 'Tagliata di Manzo'),
    (SELECT id FROM inventory_items WHERE name = 'Carne macinata'),
    0.25,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Tagliata di Manzo'),
    (SELECT id FROM inventory_items WHERE name = 'Parmigiano Reggiano'),
    0.02,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Tagliata di Manzo'),
    (SELECT id FROM inventory_items WHERE name = 'Olio extra vergine'),
    0.02,
    'l'
  ),

  -- Patate al Forno
  (
    (SELECT id FROM menu_items WHERE name = 'Patate al Forno'),
    (SELECT id FROM inventory_items WHERE name = 'Patate'),
    0.3,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Patate al Forno'),
    (SELECT id FROM inventory_items WHERE name = 'Olio extra vergine'),
    0.03,
    'l'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Patate al Forno'),
    (SELECT id FROM inventory_items WHERE name = 'Sale fino'),
    0.005,
    'kg'
  ),

  -- Tiramisù
  (
    (SELECT id FROM menu_items WHERE name = 'Tiramisù'),
    (SELECT id FROM inventory_items WHERE name = 'Caffè in grani'),
    0.02,
    'kg'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Tiramisù'),
    (SELECT id FROM inventory_items WHERE name = 'Uova'),
    3,
    'pz'
  ),
  (
    (SELECT id FROM menu_items WHERE name = 'Tiramisù'),
    (SELECT id FROM inventory_items WHERE name = 'Cacao in polvere'),
    0.01,
    'kg'
  );