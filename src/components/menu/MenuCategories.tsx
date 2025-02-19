import { Pencil, Trash2 } from 'lucide-react';
import type { MenuCategory } from '@/lib/menu';

interface Props {
  categories: MenuCategory[];
  selectedCategory: number | 'all';
  onSelectCategory: (id: number | 'all') => void;
  onEditCategory: (category: MenuCategory) => void;
  onDeleteCategory: (id: number) => void;
}

export default function MenuCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory
}: Props) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorie</h2>
      <div className="space-y-2">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
            selectedCategory === 'all'
              ? 'bg-red-50 text-red-700'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          Tutti i piatti
        </button>
        {categories.map(category => (
          <div
            key={category.id}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-red-50 text-red-700'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => onSelectCategory(category.id)}
              title={category.description || ''}
            >
              <span>{category.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCategory(category);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(category.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}