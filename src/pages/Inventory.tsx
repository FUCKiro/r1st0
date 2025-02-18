import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, type InventoryItem } from '@/lib/inventory';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    minimumQuantity: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await getInventoryItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dell\'inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await updateInventoryItem(selectedItem.id, {
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          minimum_quantity: parseFloat(formData.minimumQuantity)
        });
      } else {
        await createInventoryItem({
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          minimum_quantity: parseFloat(formData.minimumQuantity)
        });
      }
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({ name: '', quantity: '', unit: '', minimumQuantity: '' });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo?')) return;
    try {
      await deleteInventoryItem(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione');
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Caricamento inventario...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Magazzino
        </h1>
        <button
          onClick={() => {
            setSelectedItem(null);
            setFormData({ name: '', quantity: '', unit: '', minimumQuantity: '' });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuovo Articolo
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
          placeholder="Cerca articoli..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
        />
      </div>

      <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Package className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Quantità:</span>
                      <span className="ml-1 font-medium">{item.quantity} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Scorta minima:</span>
                      <span className="ml-1 font-medium">{item.minimum_quantity} {item.unit}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      {item.quantity <= item.minimum_quantity ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Sotto scorta
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Disponibile
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setFormData({
                        name: item.name,
                        quantity: item.quantity.toString(),
                        unit: item.unit,
                        minimumQuantity: item.minimum_quantity.toString()
                      });
                      setIsModalOpen(true);
                    }}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    <Pencil className="w-4 h-4 sm:inline-block hidden" />
                    <span className="sm:hidden">Modifica</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 sm:inline-block hidden" />
                    <span className="sm:hidden">Elimina</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedItem ? 'Modifica Articolo' : 'Nuovo Articolo'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedItem(null);
                  setFormData({ name: '', quantity: '', unit: '', minimumQuantity: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome articolo
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantità
                </label>
                <input
                  type="number"
                  id="quantity"
                  step="0.01"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unità di misura
                </label>
                <input
                  type="text"
                  id="unit"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="minimumQuantity" className="block text-sm font-medium text-gray-700">
                  Scorta minima
                </label>
                <input
                  type="number"
                  id="minimumQuantity"
                  step="0.01"
                  min="0"
                  required
                  value={formData.minimumQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumQuantity: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedItem(null);
                    setFormData({ name: '', quantity: '', unit: '', minimumQuantity: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {selectedItem ? 'Salva Modifiche' : 'Crea Articolo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}