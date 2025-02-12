import { supabase } from './supabase';
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { error: signUpError, data } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw signUpError;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user?.id,
    email,
    full_name: fullName,
    role: 'waiter',
  });

  if (profileError) throw profileError;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}