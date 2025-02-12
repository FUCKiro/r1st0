import { useState } from 'react';
import { Package } from 'lucide-react';

const tables = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: Math.random() > 0.5 ? 'occupied' : 'free',
  guests: Math.floor(Math.random() * 6) + 1,
}));

export default function Tables() {
  const [filter, setFilter] = useState('all');

  const filteredTables = tables.filter(table => {
    if (filter === 'occupied') return table.status === 'occupied';
    if (filter === 'free') return table.status === 'free';
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Tavoli</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          >
            <option value="all">Tutti</option>
            <option value="free">Liberi</option>
            <option value="occupied">Occupati</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`p-4 rounded-lg shadow-sm border-2 ${
              table.status === 'occupied'
                ? 'border-red-500 bg-red-50'
                : 'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Tavolo {table.id}</h3>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  table.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {table.status === 'occupied' ? 'Occupato' : 'Libero'}
              </span>
            </div>
            <div className="flex items-center text-gray-600">
              <Package className="w-4 h-4 mr-2" />
              <span>{table.guests} persone</span>
            </div>
          </div>
        ))}
      </div>

      <button
        className="fixed bottom-20 md:bottom-8 right-8 p-4 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <Package className="w-6 h-6" />
      </button>
    </div>
  );
}