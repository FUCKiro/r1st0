import { supabase } from './supabase';
import type { Table } from './tables';
import type { MenuItem } from './menu';

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  notes?: string;
  weight_kg?: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
}

export interface Order {
  id: number;
  table_id: number;
  waiter_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  table?: Table;
  items?: OrderItem[];
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(*),
      items:order_items(
        *,
        menu_item:menu_items(*)
      )
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createOrder(data: {
  table_id: number;
  notes?: string;
  items: Array<{
    menu_item_id: number;
    quantity: number;
    notes?: string;
  }>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{
      table_id: data.table_id,
      waiter_id: user.id,
      status: 'pending',
      notes: data.notes,
      total_amount: 0
    }])
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      data.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes,
        status: 'pending'
      }))
    );

  if (itemsError) throw itemsError;

  return order;
}

export async function addToOrder(orderId: number, items: Array<{
  menu_item_id: number;
  quantity: number;
  notes?: string;
}>) {
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      items.map(item => ({
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes,
        status: 'pending'
      }))
    );

  if (itemsError) throw itemsError;
}

export async function updateOrderStatus(
  orderId: number,
  status: Order['status']
) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);
    
  if (error) throw error;
}

export async function updateOrderItemStatus(
  itemId: number,
  status: OrderItem['status']
) {
  const { error } = await supabase
    .from('order_items')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);
    
  if (error) throw error;
}

export async function deleteOrder(id: number) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export function useOrdersSubscription(onUpdate: () => void) {
  supabase
    .channel('orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items'
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}