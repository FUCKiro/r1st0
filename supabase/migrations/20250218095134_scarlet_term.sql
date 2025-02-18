/*
  # Gestione ordini per tavoli uniti

  1. Nuove Funzioni
    - Funzione per ottenere tutti i tavoli uniti
    - Funzione per aggiornare lo stato di tutti i tavoli uniti

  2. Modifiche
    - Aggiunta colonna merged_order_id agli ordini
    - Aggiunta vincoli e indici per le relazioni tra ordini
*/

-- Aggiunta colonna per collegare ordini di tavoli uniti
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS merged_order_id integer REFERENCES orders(id);

-- Indice per ottimizzare le query sugli ordini uniti
CREATE INDEX IF NOT EXISTS orders_merged_order_id_idx ON orders(merged_order_id);

-- Funzione per ottenere tutti i tavoli uniti
CREATE OR REPLACE FUNCTION get_merged_tables(p_table_id integer)
RETURNS integer[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_merged_tables integer[];
BEGIN
  -- Ottieni il tavolo principale e i tavoli uniti
  SELECT 
    ARRAY[id] || merged_with
  INTO v_merged_tables
  FROM tables
  WHERE id = p_table_id
  AND merged_with IS NOT NULL
  AND array_length(merged_with, 1) > 0;

  RETURN v_merged_tables;
END;
$$;

-- Funzione per aggiornare lo stato di tutti i tavoli uniti
CREATE OR REPLACE FUNCTION update_merged_tables_status(
  p_table_id integer,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_merged_tables integer[];
BEGIN
  -- Ottieni tutti i tavoli uniti
  SELECT get_merged_tables(p_table_id) INTO v_merged_tables;
  
  -- Se ci sono tavoli uniti, aggiorna lo stato di tutti
  IF v_merged_tables IS NOT NULL THEN
    UPDATE tables
    SET 
      status = p_status,
      updated_at = now()
    WHERE id = ANY(v_merged_tables);
  END IF;
END;
$$;

-- Trigger per aggiornare lo stato dei tavoli uniti quando cambia lo stato di un tavolo
CREATE OR REPLACE FUNCTION trigger_update_merged_tables_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se il tavolo è unito ad altri, aggiorna lo stato di tutti
  IF NEW.merged_with IS NOT NULL AND array_length(NEW.merged_with, 1) > 0 THEN
    PERFORM update_merged_tables_status(NEW.id, NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_merged_tables_status
  AFTER UPDATE OF status ON tables
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION trigger_update_merged_tables_status();