import { X } from 'lucide-react';
import type { Table } from '@/lib/tables';
import type { MenuItem, MenuCategory } from '@/lib/menu';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number) => void;
  formData: {
    table_id: string;
    notes: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      notes: string;
      weight_kg?: number;
    }>;
  };
  onUpdateFormData: (data: {
    table_id: string;
    notes: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      notes: string;
      weight_kg?: number;
    }>;
  }) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: string, value: string | number) => void;
  title: string;
  submitText: string;
}

export default function OrderModal({
  isOpen,
  onClose,
  onSubmit,
  tables,
  categories,
  menuItems,
  selectedCategoryId,
  onSelectCategory,
  formData,
  onUpdateFormData,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  title,
  submitText
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[95vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col md:flex-row gap-4 p-6 overflow-y-auto">
            <div className="w-full md:w-1/3 space-y-4">
              <div>
                <label htmlFor="table" className="block text-sm font-medium text-gray-700">
                  Tavolo
                </label>
                <select
                  id="table"
                  required
                  value={formData.table_id}
                  onChange={(e) => onUpdateFormData({ ...formData, table_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Seleziona tavolo</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      Tavolo {table.number} ({table.capacity} posti)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Note ordine
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => onUpdateFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Note opzionali per l'ordine..."
                />
              </div>
            </div>

            <div className="w-full md:w-2/3 md:border-l border-gray-200 md:pl-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onSelectCategory(category.id)}
                      className={`flex-shrink-0 text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap ${
                        selectedCategoryId === category.id
                          ? 'bg-red-50 text-red-700 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={onAddItem}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Aggiungi piatto
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <select
                            required
                            value={item.menu_item_id}
                            onChange={(e) => onUpdateItem(index, 'menu_item_id', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm [&_*]:text-left"
                          >
                            <option value="" disabled>Seleziona piatto</option>
                            {menuItems
                              .filter(menuItem => menuItem.category_id === selectedCategoryId)
                              .map(menuItem => (
                                <option key={menuItem.id} value={menuItem.id}>
                                  {menuItem.name} - {menuItem.is_weight_based 
                                    ? `€${((menuItem.price_per_kg || 0) / 10).toFixed(2)}/hg`
                                    : `€${menuItem.price.toFixed(2)}`
                                  }
                                </option>
                              ))}
                          </select>
                        </div>

                        {menuItems.find(menuItem => menuItem.id === parseInt(item.menu_item_id))?.is_weight_based ? (
                          <div className="w-full sm:w-32">
                            <div className="relative">
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                required
                                value={item.weight_kg || ''}
                                onChange={(e) => onUpdateItem(index, 'weight_kg', parseFloat(e.target.value))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 pr-8"
                                placeholder="Peso"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                kg
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full sm:w-20">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                          />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-white">
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
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}