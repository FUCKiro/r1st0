import { supabase } from './supabase';

export interface Reservation {
  id: number;
  table_id: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  guests: number;
  date: string;
  time: string;
  duration: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export async function getReservations(date?: string) {
  let query = supabase
    .from('reservations')
    .select('*')
    .order('date')
    .order('time');
    
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createReservation(data: Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  const { error } = await supabase
    .from('reservations')
    .insert([{ ...data, status: 'confirmed' }]);
    
  if (error) throw error;
}

export async function updateReservation(id: number, data: Partial<Reservation>) {
  const { error } = await supabase
    .from('reservations')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteReservation(id: number) {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export function useReservationSubscription(onUpdate: () => void) {
  supabase
    .channel('reservations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations'
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}