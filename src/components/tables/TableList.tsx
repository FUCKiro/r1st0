import type { Table } from '@/lib/tables';
import TableListItem from './TableListItem';

interface Props {
  tables: Table[];
  isMergeMode: boolean;
  selectedTables: number[];
  onTableSelect: (tableId: number) => void;
  onTableClick: (table: Table) => void;
  onStatusChange: (id: number, status: Table['status']) => void;
  onShowActions: (id: number | null) => void;
  showActionsFor: number | null;
  onEdit: (table: Table) => void;
  onDelete: (id: number) => void;
  onNotes: (table: Table) => void;
  onUnmerge: (id: number) => void;
  onReserve: (table: Table) => void;
}

export default function TableList({
  tables,
  isMergeMode,
  selectedTables,
  onTableSelect,
  onTableClick,
  onStatusChange,
  onShowActions,
  showActionsFor,
  onEdit,
  onDelete,
  onNotes,
  onUnmerge,
  onReserve
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table) => (
        <TableListItem
          key={table.id}
          table={table}
          isMergeMode={isMergeMode}
          isSelected={selectedTables.includes(table.id)}
          onSelect={() => onTableSelect(table.id)}
          onClick={() => onTableClick(table)}
          onStatusChange={onStatusChange}
          showActions={showActionsFor === table.id}
          onShowActions={onShowActions}
          onEdit={onEdit}
          onDelete={onDelete}
          onNotes={onNotes}
          onUnmerge={onUnmerge}
          onReserve={onReserve}
        />
      ))}
    </div>
  );
}