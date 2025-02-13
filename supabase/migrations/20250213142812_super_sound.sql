/*
  # Aggiungi articoli di esempio all'inventario

  1. Nuovi Dati
    - Ingredienti base per la cucina
    - Bevande per il bar
    - Quantità e unità di misura appropriate
    - Scorte minime configurate
*/

-- Ingredienti base
INSERT INTO inventory_items (name, quantity, unit, minimum_quantity) VALUES
  ('Farina 00', 25.0, 'kg', 10.0),
  ('Pomodori pelati', 30.0, 'kg', 15.0),
  ('Mozzarella', 20.0, 'kg', 8.0),
  ('Olio extra vergine', 15.0, 'l', 5.0),
  ('Sale fino', 10.0, 'kg', 3.0),
  ('Basilico fresco', 2.0, 'kg', 0.5),
  ('Parmigiano Reggiano', 8.0, 'kg', 3.0),
  ('Pasta spaghetti', 20.0, 'kg', 8.0),
  ('Pasta penne', 15.0, 'kg', 8.0),
  ('Riso Carnaroli', 12.0, 'kg', 5.0),
  ('Carne macinata', 15.0, 'kg', 5.0),
  ('Pesce spada', 8.0, 'kg', 3.0),
  ('Vongole', 10.0, 'kg', 4.0),
  ('Patate', 25.0, 'kg', 10.0),
  ('Cipolle', 15.0, 'kg', 5.0),
  ('Aglio', 3.0, 'kg', 1.0),
  ('Prezzemolo', 1.5, 'kg', 0.5),
  ('Pepe nero', 2.0, 'kg', 0.5),
  ('Uova', 200.0, 'pz', 50.0),
  ('Burro', 10.0, 'kg', 3.0);

-- Bevande
INSERT INTO inventory_items (name, quantity, unit, minimum_quantity) VALUES
  -- Vini
  ('Vino Rosso della Casa', 50.0, 'l', 20.0),
  ('Vino Bianco della Casa', 50.0, 'l', 20.0),
  ('Prosecco', 30.0, 'bottiglie', 10.0),
  ('Champagne', 15.0, 'bottiglie', 5.0),
  
  -- Liquori base per cocktail
  ('Vodka Premium', 8.0, 'l', 3.0),
  ('Gin London Dry', 8.0, 'l', 3.0),
  ('Rum Bianco', 6.0, 'l', 2.0),
  ('Rum Scuro', 6.0, 'l', 2.0),
  ('Tequila', 5.0, 'l', 2.0),
  ('Triple Sec', 4.0, 'l', 1.5),
  ('Vermouth Rosso', 5.0, 'l', 2.0),
  ('Vermouth Bianco', 5.0, 'l', 2.0),
  ('Campari', 4.0, 'l', 1.5),
  ('Aperol', 4.0, 'l', 1.5),
  
  -- Soft drinks e mixer
  ('Coca Cola', 100.0, 'l', 30.0),
  ('Sprite', 50.0, 'l', 15.0),
  ('Fanta', 50.0, 'l', 15.0),
  ('Acqua Tonica', 40.0, 'l', 15.0),
  ('Succo di limone', 10.0, 'l', 3.0),
  ('Succo di arancia', 10.0, 'l', 3.0),
  
  -- Birre
  ('Birra alla spina', 100.0, 'l', 30.0),
  ('Birra artigianale IPA', 30.0, 'bottiglie', 10.0),
  ('Birra artigianale Weiss', 30.0, 'bottiglie', 10.0),
  
  -- Caffetteria
  ('Caffè in grani', 10.0, 'kg', 3.0),
  ('Latte fresco', 20.0, 'l', 5.0),
  ('Zucchero', 8.0, 'kg', 3.0),
  ('Cacao in polvere', 2.0, 'kg', 0.5),
  ('Tè assortiti', 200.0, 'bustine', 50.0);