import { Pencil, Trash2, Leaf, Wheat, Flame } from 'lucide-react';
import type { MenuItem } from '@/lib/menu';

interface Props {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

export default function MenuList({ items, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <span className="text-lg font-semibold text-red-600">
                {item.is_weight_based 
                  ? `€${((item.price_per_kg || 0) / 10).toFixed(2)}/hg`
                  : `€${item.price.toFixed(2)}`
                }
              </span>
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {item.is_vegetarian && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Leaf className="w-3 h-3 mr-1" />
                  Vegetariano
                </span>
              )}
              {item.is_vegan && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Leaf className="w-3 h-3 mr-1" />
                  Vegano
                </span>
              )}
              {item.is_gluten_free && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Wheat className="w-3 h-3 mr-1" />
                  Senza glutine
                </span>
              )}
              {item.spiciness_level > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Flame className="w-3 h-3 mr-1" />
                  {'🌶️'.repeat(item.spiciness_level)}
                </span>
              )}
            </div>

            {item.allergens.length > 0 && (
              <div className="text-xs text-gray-500 mb-3">
                <strong>Allergeni:</strong> {item.allergens.join(', ')}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => onEdit(item)}
                title="Modifica"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => onDelete(item.id)}
                title="Elimina"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}