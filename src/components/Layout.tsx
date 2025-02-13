import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ListRestart as Restaurant, Receipt, Package, User, ChefHat, LogOut, Users } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  role: string;
  email: string;
  full_name: string;
}

export default function Layout() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!user || !session) {
        navigate('/login');
        return;
      }

      // Ottieni il ruolo dalla sessione
      const sessionRole = session.user.user_metadata?.role;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignora errore "non trovato"
        throw error;
      }

      // Se il profilo esiste, usalo
      if (profile) {
        setProfile(profile);
      } else {
        // Se il profilo non esiste, crealo con il ruolo dalla sessione
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            role: sessionRole || 'waiter',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      navigate('/login');
    }
  }, [navigate]);
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Funzione per verificare i permessi
  const hasPermission = useCallback((allowedRoles: string[]) => {
    return profile && allowedRoles.includes(profile.role);
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 md:relative md:w-64 md:border-r md:border-t-0">
        <div className="flex justify-around md:flex-col md:h-full md:p-4">
          <NavLink
            to="/tables"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${
                isActive ? 'text-red-500' : 'text-gray-600'
              }`
            }
          >
            <Restaurant className="w-6 h-6" />
            <span className="hidden md:block ml-2">Tavoli</span>
          </NavLink>
          
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${
                isActive ? 'text-red-500' : 'text-gray-600'
              }`
            }
          >
            <ChefHat className="w-6 h-6" />
            <span className="hidden md:block ml-2">Menu</span>
          </NavLink>
          
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex items-center p-4 hover:text-red-500 ${
                isActive ? 'text-red-500' : 'text-gray-600'
              }`
            }
          >
            <Receipt className="w-6 h-6" />
            <span className="hidden md:block ml-2">Ordini</span>
          </NavLink>
          
          {hasPermission(['admin', 'manager']) && (
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `flex items-center p-4 hover:text-red-500 ${
                  isActive ? 'text-red-500' : 'text-gray-600'
                }`
              }
            >
              <Package className="w-6 h-6" />
              <span className="hidden md:block ml-2">Magazzino</span>
            </NavLink>
          )}

          {hasPermission(['admin']) && (
            <NavLink
              to="/waiters"
              className={({ isActive }) =>
                `flex items-center p-4 hover:text-red-500 ${
                  isActive ? 'text-red-500' : 'text-gray-600'
                }`
              }
            >
              <Users className="w-6 h-6" />
              <span className="hidden md:block ml-2">Camerieri</span>
            </NavLink>
          )}
          
          {hasPermission(['admin', 'manager']) && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center p-4 hover:text-red-500 ${
                  isActive ? 'text-red-500' : 'text-gray-600'
                }`
              }
            >
              <User className="w-6 h-6" />
              <span className="hidden md:block ml-2">Profilo</span>
            </NavLink>
          )}

          {/* Il pulsante di logout è sempre visibile */}
          <button
            onClick={handleSignOut}
            className="flex items-center p-4 text-gray-600 hover:text-red-500"
          >
            <LogOut className="w-6 h-6" />
            <span className="hidden md:block ml-2">Esci</span>
          </button>
        </div>
      </nav>
      
      <main className="flex-1 p-4 md:p-8 mb-16 md:mb-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}