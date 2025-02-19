import { Users, StickyNote, MoreVertical, Pencil, Trash2, Calendar, Unlink } from 'lucide-react';
import type { Table } from '@/lib/tables';

interface Props {
  table: Table;
  isMergeMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onStatusChange: (id: number, status: Table['status']) => void;
  showActions: boolean;
  onShowActions: (id: number | null) => void;
  onEdit: (table: Table) => void;
  onDelete: (id: number) => void;
  onNotes: (table: Table) => void;
  onUnmerge: (id: number) => void;
  onReserve: (table: Table) => void;
}

export default function TableListItem({
  table,
  isMergeMode,
  isSelected,
  onSelect,
  onClick,
  onStatusChange,
  showActions,
  onShowActions,
  onEdit,
  onDelete,
  onNotes,
  onUnmerge,
  onReserve
}: Props) {
  return (
    <div
      onClick={() => isMergeMode ? onSelect() : onClick()}
      className={`p-4 rounded-lg shadow-sm border-2 relative ${
        isMergeMode && isSelected
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50'
          : table.status === 'occupied'
          ? 'border-red-500 bg-gradient-to-br from-red-50 to-red-100/50'
          : table.status === 'reserved'
          ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100/50'
          : 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50'
      } ${isMergeMode ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">Tavolo {table.number}</h3>
          {table.merged_with && table.merged_with.length > 0 && (
            <div className="text-[10px] sm:text-xs text-blue-600 font-medium">
              Unito con {table.merged_with.join(', ')}
            </div>
          )}
        </div>
        <span
          className={`px-1 py-0.5 rounded-full text-[10px] sm:text-xs ${
            table.status === 'occupied'
              ? 'bg-red-100/80 text-red-800 backdrop-blur-sm'
              : table.status === 'reserved'
              ? 'bg-yellow-100/80 text-yellow-800 backdrop-blur-sm'
              : 'bg-green-100/80 text-green-800 backdrop-blur-sm'
          }`}
        >
          {table.status === 'occupied'
            ? 'Occupato'
            : table.status === 'reserved'
            ? 'Prenotato'
            : 'Libero'}
        </span>
      </div>

      <div className="flex items-center text-gray-600 text-[10px] sm:text-xs bg-white/50 rounded-md px-1 py-0.5 mb-3">
        <Users className="w-3 h-3 mr-1" />
        <span>{table.capacity}</span>
      </div>

      {table.notes && (
        <div className="mb-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm p-2 rounded-lg shadow-sm">
          <div className="flex items-start gap-2">
            <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="flex-1">{table.notes}</p>
          </div>
        </div>
      )}

      {!isMergeMode && (
        <div className="relative">
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowActions(showActions ? null : table.id);
              }}
              className="p-1 hover:bg-gray-100/50 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {showActions && (
            <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1 divide-y divide-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(table);
                    onShowActions(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifica
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotes(table);
                    onShowActions(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Note
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReserve(table);
                    onShowActions(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Prenota
                </button>
                {table.merged_with && table.merged_with.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnmerge(table.id);
                      onShowActions(null);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Separa tavoli
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(table.id);
                    onShowActions(null);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isMergeMode && (
        <div className="flex gap-2">
          {table.status !== 'free' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(table.id, 'free');
              }}
              className="flex-1 px-2 py-1 text-sm bg-green-100/80 text-green-700 rounded-lg hover:bg-green-200/80 transition-colors backdrop-blur-sm"
            >
              Libera
            </button>
          )}
          {table.status !== 'occupied' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(table.id, 'occupied');
              }}
              className="flex-1 px-2 py-1 text-sm bg-red-100/80 text-red-700 rounded-lg hover:bg-red-200/80 transition-colors backdrop-blur-sm"
            >
              Occupa
            </button>
          )}
          {table.status !== 'reserved' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(table.id, 'reserved');
              }}
              className="flex-1 px-2 py-1 text-sm bg-yellow-100/80 text-yellow-700 rounded-lg hover:bg-yellow-200/80 transition-colors backdrop-blur-sm"
            >
              Prenota
            </button>
          )}
        </div>
      )}
    </div>
  );
}