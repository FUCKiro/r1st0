import { supabase } from './supabase';

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number | string;
  unit: string;
  minimum_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  quantity: number | string;
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
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
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

export async function addInventoryMovement(data: {
  inventory_item_id: number;
  quantity: number;
  type: 'in' | 'out';
  notes?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utente non autenticato');

  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert([{
      ...data,
      created_by: user.id
    }]);

  if (movementError) throw movementError;

  // Aggiorna la quantità nell'inventario
  const delta = data.type === 'in' ? data.quantity : -data.quantity;
  const { error: updateError } = await supabase.rpc('update_inventory_quantity', {
    p_item_id: data.inventory_item_id,
    p_quantity_delta: delta
  });

  if (updateError) throw updateError;
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