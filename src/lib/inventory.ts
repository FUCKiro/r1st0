import { supabase } from './supabase';

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  quantity: number;
  type: 'in' | 'out';
  notes?: string;
  created_by: string;
  created_at: string;
}

export async function getInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data;
}

export async function createInventoryItem(data: {
  name: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
}) {
  const { error } = await supabase
    .from('inventory_items')
    .insert([data]);
    
  if (error) throw error;
}

export async function updateInventoryItem(
  id: number,
  data: {
    name: string;
    quantity: number;
    unit: string;
    minimum_quantity: number;
  }
) {
  const { error } = await supabase
    .from('inventory_items')
    .update(data)
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteInventoryItem(id: number) {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export async function getInventoryMovements(itemId: number) {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      created_by:profiles(full_name)
    `)
    .eq('inventory_item_id', itemId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}