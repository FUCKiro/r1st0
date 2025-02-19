import { Plus } from 'lucide-react';
import type { Order } from '@/lib/orders';

interface Props {
  onNewOrder: () => void;
  filter: Order['status'] | 'all';
  onFilterChange: (filter: Order['status'] | 'all') => void;
}

export default function OrderHeader({ onNewOrder, filter, onFilterChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Ordini
        </h1>
        <button
          onClick={onNewOrder}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuovo Ordine
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as Order['status'] | 'all')}
          className="w-48 rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
        >
          <option value="all">Tutti gli stati</option>
          <option value="pending">In attesa</option>
          <option value="preparing">In preparazione</option>
          <option value="ready">Pronti</option>
          <option value="served">Serviti</option>
          <option value="paid">Pagati</option>
          <option value="cancelled">Annullati</option>
        </select>
      </div>
    </div>
  );
}