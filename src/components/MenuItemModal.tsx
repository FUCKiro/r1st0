import { X } from 'lucide-react';
import type { MenuItem, MenuCategory } from '@/lib/menu';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: {
    name: string;
    description: string;
    price: string;
    category_id: string;
    is_available: boolean;
    preparation_time: string;
    allergens: string[];
    image_url: string;
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    spiciness_level: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    description: string;
    price: string;
    category_id: string;
    is_available: boolean;
    preparation_time: string;
    allergens: string[];
    image_url: string;
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    spiciness_level: number;
  }>>;
  selectedItem: MenuItem | null;
  categories: MenuCategory[];
}

export default function MenuItemModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedItem,
  categories
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedItem ? 'Modifica Piatto' : 'Nuovo Piatto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="flex flex-col gap-4 p-4 md:p-6 overflow-y-auto">
            <div className="space-y-3 md:space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome piatto
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrizione
                </label>
                <textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Prezzo
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                  >
                    <option value="">Seleziona categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="preparation_time" className="block text-sm font-medium text-gray-700">
                  Tempo di preparazione (minuti)
                </label>
                <input
                  type="number"
                  id="preparation_time"
                  min="1"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparation_time: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                  URL Immagine
                </label>
                <input
                  type="url"
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
              <div>
                <label htmlFor="allergens" className="block text-sm font-medium text-gray-700">
                  Allergeni (separati da punto e virgola)
                </label>
                <textarea
                  id="allergens"
                  rows={2}
                  value={formData.allergens.join('; ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    allergens: e.target.value.split(';').map(s => s.trim()).filter(Boolean)
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Livello di piccantezza
                </label>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, spiciness_level: level }))}
                      className={`px-2 py-1 rounded-md text-sm ${
                        formData.spiciness_level === level
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      } border`}
                    >
                      {level === 0 ? 'Non piccante' : '🌶️'.repeat(level)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
                    Disponibile
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_vegetarian"
                    checked={formData.is_vegetarian}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_vegetarian: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_vegetarian" className="ml-2 block text-sm text-gray-900">
                    Vegetariano
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_vegan"
                    checked={formData.is_vegan}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_vegan: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_vegan" className="ml-2 block text-sm text-gray-900">
                    Vegano
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_gluten_free"
                    checked={formData.is_gluten_free}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_gluten_free: e.target.checked }))}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_gluten_free" className="ml-2 block text-sm text-gray-900">
                    Senza glutine
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {selectedItem ? 'Salva Modifiche' : 'Crea Piatto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}