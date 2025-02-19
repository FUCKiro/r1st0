import { Plus } from 'lucide-react';

interface Props {
  onNewCategory: () => void;
  onNewItem: () => void;
}

export default function MenuHeader({ onNewCategory, onNewItem }: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
        Menu
      </h1>
      <div className="flex gap-2">
        <button
          onClick={onNewCategory}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuova Categoria
        </button>
        <button
          onClick={onNewItem}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuovo Piatto
        </button>
      </div>
    </div>
  );
}