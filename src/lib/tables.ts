import { supabase } from './supabase';

export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'free' | 'occupied' | 'reserved';
  notes?: string;
  location?: string;
  last_occupied_at?: string;
  merged_with?: number[];
  x_position?: number;
  y_position?: number;
  created_at: string;
  updated_at: string;
}

export async function getTables() {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('number');
    
  if (error) throw error;
  return data;
}

export async function updateTableStatus(id: number, status: Table['status']) {
  const { error } = await supabase
    .from('tables')
    .update({
      status,
      last_occupied_at: status === 'occupied' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) throw error;
}

export async function createTable(data: { number: number; capacity: number }) {
  const { error } = await supabase
    .from('tables')
    .insert([{ ...data, status: 'free' }]);
    
  if (error) throw error;
}

export async function updateTable(id: number, data: { number: number; capacity: number }) {
  const { error } = await supabase
    .from('tables')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteTable(id: number) {
  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export function useTableSubscription(onUpdate: () => void) {
  supabase
    .channel('tables')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables'
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}

export async function updateTablePosition(id: number, x: number, y: number) {
  const { error } = await supabase
    .from('tables')
    .update({
      x_position: x,
      y_position: y,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) throw error;
}

export async function updateTableNotes(id: number, notes: string) {
  const { error } = await supabase
    .from('tables')
    .update({
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) throw error;
}

export async function mergeTables(mainTableId: number, tableIdsToMerge: number[]) {
  const { error } = await supabase
    .from('tables')
    .update({
      merged_with: tableIdsToMerge,
      updated_at: new Date().toISOString()
    })
    .eq('id', mainTableId);
    
  if (error) throw error;
}

export async function unmergeTable(tableId: number) {
  const { error } = await supabase
    .from('tables')
    .update({
      merged_with: [],
      updated_at: new Date().toISOString()
    })
    .eq('id', tableId);
    
  if (error) throw error;
}