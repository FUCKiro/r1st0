import { useState, useEffect } from 'react';
import { Package, Plus, Search, ArrowDown, ArrowUp, X, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryMovement, type InventoryItem } from '@/lib/inventory';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
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

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await addInventoryMovement({
        inventory_item_id: selectedItem.id,
        quantity: parseFloat(movementQuantity),
        type: movementType,
        notes: movementNotes || undefined
      });
      setIsMovementModalOpen(false);
      setSelectedItem(null);
      setMovementQuantity('');
      setMovementNotes('');
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel movimento');
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Articolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantità
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unità
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scorta Minima
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.minimum_quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.quantity <= item.minimum_quantity ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Sotto scorta
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Disponibile
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setMovementType('in');
                        setMovementQuantity('');
                        setMovementNotes('');
                        setIsMovementModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Carico"
                    >
                      <ArrowDown className="w-5 h-5 inline-block" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setMovementType('out');
                        setMovementQuantity('');
                        setMovementNotes('');
                        setIsMovementModalOpen(true);
                      }}
                      className="text-orange-600 hover:text-orange-900"
                      title="Scarico"
                    >
                      <ArrowUp className="w-5 h-5 inline-block" />
                    </button>
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
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Modifica"
                    >
                      <Pencil className="w-5 h-5 inline-block" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Elimina"
                    >
                      <Trash2 className="w-5 h-5 inline-block" />
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
                <X className="w-6 h-6" />
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

      {isMovementModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {movementType === 'in' ? 'Carico Merce' : 'Scarico Merce'}
              </h2>
              <button
                onClick={() => {
                  setIsMovementModalOpen(false);
                  setSelectedItem(null);
                  setMovementQuantity('');
                  setMovementNotes('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Articolo
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  {selectedItem.name}
                </div>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantità
                </label>
                <input
                  type="number"
                  id="quantity"
                  step="0.01"
                  min="0.01"
                  required
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Aggiungi note opzionali..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsMovementModalOpen(false);
                    setSelectedItem(null);
                    setMovementQuantity('');
                    setMovementNotes('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    movementType === 'in'
                      ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
                      : 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500'
                  }`}
                >
                  {movementType === 'in' ? 'Carica' : 'Scarica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}