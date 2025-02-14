import { useState, useEffect } from 'react';
import { Plus, Search, X, Mail, User, Key, Lock } from 'lucide-react';
import { getWaiters, createWaiter, deleteWaiter, type Waiter } from '@/lib/waiters';
import { changeUserPassword } from '@/lib/auth';

export default function Waiters() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadWaiters();
  }, []);

  const loadWaiters = async () => {
    try {
      const data = await getWaiters();
      setWaiters(data);
    } catch (err) {
      console.error('Error loading waiters:', err); // Per debug
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei camerieri');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    try {
      setError(null);
      setIsModalOpen(false); // Chiudi il modal prima di iniziare
      setLoading(true);
      
      await createWaiter(formData.email, formData.password, formData.fullName);

      // Ricarica la lista dei camerieri
      await loadWaiters();

      setFormData({
        email: '',
        fullName: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error creating waiter:', err); // Per debug
      setError(err instanceof Error ? err.message : 'Errore nella creazione del cameriere');
      setIsModalOpen(true); // Riapri il modal in caso di errore
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWaiter = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo cameriere?')) return;

    try {
      await deleteWaiter(id);
      await loadWaiters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione del cameriere');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaiter) return;

    if (newPassword !== confirmNewPassword) {
      setError('Le password non coincidono');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changeUserPassword(selectedWaiter.id, newPassword);
      setIsPasswordModalOpen(false);
      setSelectedWaiter(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel cambio password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const filteredWaiters = waiters.filter(waiter =>
    waiter.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    waiter.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Caricamento camerieri...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Gestione Camerieri
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-1 md:gap-2 shadow-sm text-sm md:text-base"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nuovo Cameriere</span>
          <span className="sm:hidden">Nuovo</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cerca camerieri..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
        />
      </div>

      <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Data Registrazione
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200">
              {filteredWaiters.map((waiter) => (
                <tr key={waiter.id} className="hover:bg-gray-50/50 transition-colors block md:table-row border-b md:border-b-0 last:border-b-0">
                  <td className="px-4 py-3 md:px-6 md:py-4 whitespace-normal md:whitespace-nowrap block md:table-cell">
                    <div className="flex items-center justify-between md:justify-start">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{waiter.full_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 md:hidden">{waiter.email}</div>
                        <div className="text-xs text-gray-400 mt-0.5 md:hidden">
                          {new Date(waiter.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:hidden">
                        <button
                          onClick={() => {
                            setSelectedWaiter(waiter);
                            setNewPassword('');
                            setConfirmNewPassword('');
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Cambia password"
                        >
                          <Lock className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWaiter(waiter.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina cameriere"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{waiter.email}</div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(waiter.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedWaiter(waiter);
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setIsPasswordModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      title="Cambia password"
                    >
                      <Lock className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWaiter(waiter.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Elimina cameriere"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Nuovo Cameriere
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({
                    email: '',
                    fullName: '',
                    password: '',
                    confirmPassword: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateWaiter} className="p-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Conferma password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      email: '',
                      fullName: '',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? 'Creazione...' : 'Crea Cameriere'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambio Password */}
      {isPasswordModalOpen && selectedWaiter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Cambia Password - {selectedWaiter.full_name}
              </h2>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setSelectedWaiter(null);
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nuova Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                  Conferma Nuova Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setSelectedWaiter(null);
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Cambio in corso...' : 'Cambia Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}