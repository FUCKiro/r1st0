import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';

type Profile = {
  full_name: string | null;
  email: string;
  role: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getCurrentUser();
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  if (!profile) {
    return <div>Errore nel caricamento del profilo</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profilo</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Nome completo</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.full_name || 'Non specificato'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-lg text-gray-900">{profile.email}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Ruolo</h3>
            <p className="mt-1 text-lg text-gray-900 capitalize">{profile.role}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Esci
      </button>
    </div>
  );
}