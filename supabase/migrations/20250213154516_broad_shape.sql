/*
  # Aggiunta priorità e tipo comanda agli ordini

  1. Nuovi Campi
    - `priority` (integer): livello di priorità dell'ordine (1-5)
    - `type` (text): tipo di comanda (bar/cucina)
    - `printed` (boolean): indica se la comanda è stata stampata
    - `print_count` (integer): numero di volte che la comanda è stata stampata

  2. Funzioni
    - Aggiunta funzione per aggiornare la priorità
    - Aggiunta funzione per aggiornare lo stato di stampa

  3. Indici
    - Indice su priority per ottimizzare le query di ordinamento
*/

-- Aggiungi nuovi campi alla tabella orders
ALTER TABLE orders
  ADD COLUMN priority integer NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  ADD COLUMN type text NOT NULL DEFAULT 'kitchen' CHECK (type IN ('kitchen', 'bar')),
  ADD COLUMN printed boolean NOT NULL DEFAULT false,
  ADD COLUMN print_count integer NOT NULL DEFAULT 0;

-- Crea indice per ottimizzare le query di ordinamento per priorità
CREATE INDEX orders_priority_idx ON orders (priority DESC);

-- Funzione per aggiornare la priorità di un ordine
CREATE OR REPLACE FUNCTION update_order_priority(
  p_order_id integer,
  p_priority integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_priority < 1 OR p_priority > 5 THEN
    RAISE EXCEPTION 'La priorità deve essere compresa tra 1 e 5';
  END IF;

  UPDATE orders
  SET 
    priority = p_priority,
    updated_at = now()
  WHERE id = p_order_id;
END;
$$;

-- Funzione per aggiornare lo stato di stampa di un ordine
CREATE OR REPLACE FUNCTION update_order_print_status(
  p_order_id integer,
  p_printed boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders
  SET 
    printed = p_printed,
    print_count = CASE WHEN p_printed THEN print_count + 1 ELSE print_count END,
    updated_at = now()
  WHERE id = p_order_id;
END;
$$;