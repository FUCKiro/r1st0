import { useState, useEffect, useCallback } from 'react';
import { getTables, updateTableStatus, createTable, updateTable, deleteTable, updateTableNotes, mergeTables, unmergeTable, useTableSubscription, updateTablePosition, type Table } from '@/lib/tables';
import TableMap from '@/components/TableMap';
import ReservationModal from '@/components/ReservationModal';
import TableHeader from '@/components/tables/TableHeader';
import TableFilter from '@/components/tables/TableFilter';
import TableMergeAlert from '@/components/tables/TableMergeAlert';
import TableList from '@/components/tables/TableList';
import TableModal from '@/components/tables/TableModal';
import TableNotesModal from '@/components/tables/TableNotesModal';

export default function Tables() {
  const [filter, setFilter] = useState('all');
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTable, setEditingTable] = useState({ number: '', capacity: '' });
  const [showActionsFor, setShowActionsFor] = useState<number | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedTablesToMerge, setSelectedTablesToMerge] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [selectedTableForReservation, setSelectedTableForReservation] = useState<Table | null>(null);

  const loadTables = useCallback(async () => {
    try {
      const data = await getTables();
      setTables(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei tavoli');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    useTableSubscription(loadTables);
  }, [loadTables]);

  const handleStatusChange = async (id: number, newStatus: Table['status']) => {
    try {
      await updateTableStatus(id, newStatus);
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento del tavolo');
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.number || !newTable.capacity) return;

    try {
      setIsCreating(true);
      await createTable({
        number: parseInt(newTable.number),
        capacity: parseInt(newTable.capacity)
      });
      setNewTable({ number: '', capacity: '' });
      setIsModalOpen(false);
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione del tavolo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !editingTable.number || !editingTable.capacity) return;

    try {
      setIsEditing(true);
      await updateTable(selectedTable.id, {
        number: parseInt(editingTable.number),
        capacity: parseInt(editingTable.capacity)
      });
      setSelectedTable(null);
      setEditingTable({ number: '', capacity: '' });
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella modifica del tavolo');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo tavolo?')) return;

    try {
      await deleteTable(id);
      setShowActionsFor(null);
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione del tavolo');
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    try {
      setIsSavingNotes(true);
      await updateTableNotes(selectedTable.id, editingNotes);
      setIsNotesModalOpen(false);
      setSelectedTable(null);
      setEditingNotes('');
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio delle note');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleMergeTables = async () => {
    if (selectedTablesToMerge.length < 2) return;
    
    try {
      const mainTableId = selectedTablesToMerge[0];
      const tablesToMerge = selectedTablesToMerge.slice(1);
      await mergeTables(mainTableId, tablesToMerge);
      setSelectedTablesToMerge([]);
      setIsMergeMode(false);
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'unione dei tavoli');
    }
  };

  const handleUnmergeTable = async (tableId: number) => {
    try {
      await unmergeTable(tableId);
      await loadTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la separazione dei tavoli');
    }
  };

  const toggleTableSelection = (tableId: number) => {
    setSelectedTablesToMerge(prev => {
      if (prev.includes(tableId)) {
        return prev.filter(id => id !== tableId);
      }
      return [...prev, tableId];
    });
  };

  const filteredTables = tables.filter(table => {
    if (filter === 'occupied') return table.status === 'occupied';
    if (filter === 'free') return table.status === 'free';
    if (filter === 'reserved') return table.status === 'reserved';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Caricamento tavoli...</div>
      </div>
    );
  }

  return (
    <div>
      <TableHeader
        onNewTable={() => setIsModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isMergeMode={isMergeMode}
        onMergeModeChange={setIsMergeMode}
        selectedTablesCount={selectedTablesToMerge.length}
        onMergeTables={handleMergeTables}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <TableFilter
        filter={filter}
        onFilterChange={setFilter}
      />

      {isMergeMode && selectedTablesToMerge.length > 0 && (
        <TableMergeAlert
          selectedTablesCount={selectedTablesToMerge.length}
          onMergeTables={handleMergeTables}
        />
      )}

      {viewMode === 'map' ? (
        <TableMap
          tables={filteredTables}
          onTableClick={(table) => {
            if (isMergeMode) {
              toggleTableSelection(table.id);
            } else {
              setSelectedTableForReservation(table);
              setIsReservationModalOpen(true);
            }
          }}
          onTableMove={updateTablePosition}
        />
      ) : (
        <TableList
          tables={filteredTables}
          isMergeMode={isMergeMode}
          selectedTables={selectedTablesToMerge}
          onTableSelect={toggleTableSelection}
          onTableClick={(table) => {
            setSelectedTableForReservation(table);
            setIsReservationModalOpen(true);
          }}
          onStatusChange={handleStatusChange}
          onShowActions={setShowActionsFor}
          showActionsFor={showActionsFor}
          onEdit={(table) => {
            setSelectedTable(table);
            setEditingTable({
              number: table.number.toString(),
              capacity: table.capacity.toString()
            });
          }}
          onDelete={handleDeleteTable}
          onNotes={(table) => {
            setSelectedTable(table);
            setEditingNotes(table.notes || '');
            setIsNotesModalOpen(true);
          }}
          onUnmerge={handleUnmergeTable}
          onReserve={(table) => {
            setSelectedTableForReservation(table);
            setIsReservationModalOpen(true);
          }}
        />
      )}

      <TableModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewTable({ number: '', capacity: '' });
        }}
        onSubmit={handleCreateTable}
        formData={newTable}
        setFormData={setNewTable}
        isCreating={isCreating}
      />

      <TableModal
        isOpen={!!selectedTable}
        onClose={() => {
          setSelectedTable(null);
          setEditingTable({ number: '', capacity: '' });
        }}
        onSubmit={handleEditTable}
        formData={editingTable}
        setFormData={setEditingTable}
        isCreating={isEditing}
        isEditing
      />

      <TableNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedTable(null);
          setEditingNotes('');
        }}
        onSubmit={handleSaveNotes}
        notes={editingNotes}
        setNotes={setEditingNotes}
        isSaving={isSavingNotes}
        table={selectedTable}
      />
      
      {isReservationModalOpen && selectedTableForReservation && (
        <ReservationModal
          table={selectedTableForReservation}
          onClose={() => {
            setIsReservationModalOpen(false);
            setSelectedTableForReservation(null);
          }}
          onSave={async () => {
            await loadTables();
            setIsReservationModalOpen(false);
            setSelectedTableForReservation(null);
          }}
        />
      )}
    </div>
  );
}