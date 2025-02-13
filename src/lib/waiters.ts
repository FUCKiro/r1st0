import { supabase } from './supabase';

export interface Waiter {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export async function getWaiters() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('role', 'waiter')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createWaiter(email: string, password: string, fullName: string) {
  // Verifica che l'utente corrente sia admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Utente non autenticato');

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'admin') {
    throw new Error('Non hai i permessi per creare camerieri');
  }

  // Crea l'utente con Supabase Auth
  const { error: signUpError, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'waiter'
      }
    }
  });

  if (signUpError) throw signUpError;
  if (!data.user) throw new Error('Errore durante la creazione dell\'utente');

  // Crea il profilo con ruolo waiter
  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    role: 'waiter',
    updated_at: new Date().toISOString()
  });

  if (profileError) throw profileError;
}

export async function deleteWaiter(id: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}