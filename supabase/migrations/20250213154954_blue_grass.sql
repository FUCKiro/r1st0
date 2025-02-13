/*
  # Espansione del sistema dei ruoli

  1. Nuovi Ruoli
    - Aggiunge nuovi ruoli più specifici per il personale
    - Aggiunge tabella per i permessi
    - Aggiunge tabella per l'assegnazione dei permessi ai ruoli
    
  2. Permessi
    - Definisce permessi granulari per ogni area dell'applicazione
    - Permette di assegnare permessi specifici a ciascun ruolo
    
  3. Sicurezza
    - Aggiunge RLS per le nuove tabelle
    - Aggiunge funzioni di utilità per la gestione dei permessi
*/

-- Aggiorna il check constraint dei ruoli con i nuovi ruoli
ALTER TABLE profiles
  DROP CONSTRAINT profiles_role_check,
  ADD CONSTRAINT profiles_role_check CHECK (role IN (
    'admin',           -- Amministratore con accesso completo
    'manager',         -- Manager del ristorante
    'head_chef',       -- Chef capo
    'chef',           -- Chef
    'sous_chef',      -- Sous chef
    'head_waiter',    -- Cameriere capo
    'waiter',         -- Cameriere
    'trainee_waiter', -- Cameriere in formazione
    'bartender',      -- Barista
    'head_bartender', -- Barista capo
    'cashier',        -- Cassiere
    'host',           -- Addetto all'accoglienza
    'kitchen_staff'   -- Staff cucina
  ));

-- Tabella dei permessi
CREATE TABLE permissions (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella per l'assegnazione dei permessi ai ruoli
CREATE TABLE role_permissions (
  role text NOT NULL,
  permission_id integer REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role, permission_id),
  CONSTRAINT role_permissions_role_check CHECK (role IN (
    'admin', 'manager', 'head_chef', 'chef', 'sous_chef',
    'head_waiter', 'waiter', 'trainee_waiter', 'bartender',
    'head_bartender', 'cashier', 'host', 'kitchen_staff'
  ))
);

-- Trigger per updated_at
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS per permissions
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere i permessi"
  ON permissions FOR SELECT
  USING (true);

CREATE POLICY "Solo admin può gestire i permessi"
  ON permissions
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS per role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono vedere le assegnazioni dei permessi"
  ON role_permissions FOR SELECT
  USING (true);

CREATE POLICY "Solo admin può gestire le assegnazioni dei permessi"
  ON role_permissions
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Funzione per verificare se un utente ha un permesso specifico
CREATE OR REPLACE FUNCTION has_permission(p_user_id uuid, p_permission_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN role_permissions rp ON p.role = rp.role
    JOIN permissions perm ON rp.permission_id = perm.id
    WHERE p.id = p_user_id
    AND perm.code = p_permission_code
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;

-- Inserimento dei permessi base
INSERT INTO permissions (code, name, description, category) VALUES
  -- Tavoli
  ('tables.view', 'Visualizza tavoli', 'Può vedere la lista dei tavoli', 'tables'),
  ('tables.edit', 'Modifica tavoli', 'Può modificare i tavoli', 'tables'),
  ('tables.manage', 'Gestione tavoli', 'Può gestire completamente i tavoli', 'tables'),
  
  -- Ordini
  ('orders.view', 'Visualizza ordini', 'Può vedere gli ordini', 'orders'),
  ('orders.create', 'Crea ordini', 'Può creare nuovi ordini', 'orders'),
  ('orders.edit', 'Modifica ordini', 'Può modificare gli ordini esistenti', 'orders'),
  ('orders.delete', 'Elimina ordini', 'Può eliminare gli ordini', 'orders'),
  ('orders.manage', 'Gestione ordini', 'Può gestire completamente gli ordini', 'orders'),
  
  -- Menu
  ('menu.view', 'Visualizza menu', 'Può vedere il menu', 'menu'),
  ('menu.edit', 'Modifica menu', 'Può modificare il menu', 'menu'),
  ('menu.prices', 'Gestione prezzi', 'Può modificare i prezzi', 'menu'),
  ('menu.manage', 'Gestione menu', 'Può gestire completamente il menu', 'menu'),
  
  -- Magazzino
  ('inventory.view', 'Visualizza magazzino', 'Può vedere il magazzino', 'inventory'),
  ('inventory.edit', 'Modifica magazzino', 'Può modificare il magazzino', 'inventory'),
  ('inventory.manage', 'Gestione magazzino', 'Può gestire completamente il magazzino', 'inventory'),
  
  -- Prenotazioni
  ('reservations.view', 'Visualizza prenotazioni', 'Può vedere le prenotazioni', 'reservations'),
  ('reservations.create', 'Crea prenotazioni', 'Può creare prenotazioni', 'reservations'),
  ('reservations.edit', 'Modifica prenotazioni', 'Può modificare le prenotazioni', 'reservations'),
  ('reservations.manage', 'Gestione prenotazioni', 'Può gestire completamente le prenotazioni', 'reservations'),
  
  -- Cucina
  ('kitchen.view', 'Visualizza cucina', 'Può vedere gli ordini della cucina', 'kitchen'),
  ('kitchen.manage', 'Gestione cucina', 'Può gestire gli ordini della cucina', 'kitchen'),
  
  -- Bar
  ('bar.view', 'Visualizza bar', 'Può vedere gli ordini del bar', 'bar'),
  ('bar.manage', 'Gestione bar', 'Può gestire gli ordini del bar', 'bar'),
  
  -- Cassa
  ('cash.view', 'Visualizza cassa', 'Può vedere la cassa', 'cash'),
  ('cash.manage', 'Gestione cassa', 'Può gestire la cassa', 'cash'),
  
  -- Staff
  ('staff.view', 'Visualizza staff', 'Può vedere lo staff', 'staff'),
  ('staff.manage', 'Gestione staff', 'Può gestire lo staff', 'staff');

-- Assegnazione dei permessi ai ruoli
-- Admin
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Manager
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions
WHERE category IN ('tables', 'orders', 'menu', 'inventory', 'reservations', 'kitchen', 'bar', 'cash', 'staff');

-- Head Chef
INSERT INTO role_permissions (role, permission_id)
SELECT 'head_chef', id FROM permissions
WHERE code IN (
  'kitchen.view', 'kitchen.manage',
  'inventory.view', 'inventory.edit',
  'menu.view', 'menu.edit'
);

-- Chef
INSERT INTO role_permissions (role, permission_id)
SELECT 'chef', id FROM permissions
WHERE code IN (
  'kitchen.view',
  'inventory.view',
  'menu.view'
);

-- Head Waiter
INSERT INTO role_permissions (role, permission_id)
SELECT 'head_waiter', id FROM permissions
WHERE code IN (
  'tables.view', 'tables.edit',
  'orders.view', 'orders.create', 'orders.edit',
  'menu.view',
  'reservations.view', 'reservations.create', 'reservations.edit'
);

-- Waiter
INSERT INTO role_permissions (role, permission_id)
SELECT 'waiter', id FROM permissions
WHERE code IN (
  'tables.view',
  'orders.view', 'orders.create',
  'menu.view',
  'reservations.view', 'reservations.create'
);

-- Head Bartender
INSERT INTO role_permissions (role, permission_id)
SELECT 'head_bartender', id FROM permissions
WHERE code IN (
  'bar.view', 'bar.manage',
  'inventory.view', 'inventory.edit'
);

-- Bartender
INSERT INTO role_permissions (role, permission_id)
SELECT 'bartender', id FROM permissions
WHERE code IN (
  'bar.view',
  'inventory.view'
);

-- Cashier
INSERT INTO role_permissions (role, permission_id)
SELECT 'cashier', id FROM permissions
WHERE code IN (
  'cash.view', 'cash.manage',
  'orders.view'
);

-- Host
INSERT INTO role_permissions (role, permission_id)
SELECT 'host', id FROM permissions
WHERE code IN (
  'tables.view',
  'reservations.view', 'reservations.create'
);