import { supabase } from './supabase';
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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