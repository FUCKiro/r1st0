import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, X, MoreVertical, Pencil, Trash2, StickyNote, Link2, Unlink, Map, Calendar } from 'lucide-react';
import { getTables, updateTableStatus, createTable, updateTable, deleteTable, updateTableNotes, mergeTables, unmergeTable, useTableSubscription, updateTablePosition, type Table } from '@/lib/tables';
import TableMap from '@/components/TableMap';
import ReservationModal from '@/components/ReservationModal';

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

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
            <option value="reserved">Prenotati</option>
          </select>
          <button
            onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
            className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {viewMode === 'list' ? (
              <>
                <Map className="w-4 h-4 inline-block mr-2" />
                Mappa
              </>
            ) : (
              <>
                <Users className="w-4 h-4 inline-block mr-2" />
                Lista
              </>
            )}
          </button>
          <button
            onClick={() => {
              setIsMergeMode(!isMergeMode);
              setSelectedTablesToMerge([]);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isMergeMode
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link2 className="w-4 h-4 inline-block mr-2" />
            {isMergeMode ? 'Annulla Unione' : 'Unisci Tavoli'}
          </button>
        </div>
      </div>

      {isMergeMode && selectedTablesToMerge.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 font-medium">
                Tavoli selezionati: {selectedTablesToMerge.length}
              </p>
              <p className="text-sm text-red-600">
                {selectedTablesToMerge.length === 1
                  ? 'Seleziona almeno un altro tavolo da unire'
                  : 'Clicca "Unisci" per completare l\'operazione'}
              </p>
            </div>
            <button
              onClick={handleMergeTables}
              disabled={selectedTablesToMerge.length < 2}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              Unisci
            </button>
          </div>
        </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`p-4 rounded-lg shadow-sm border-2 relative ${
              isMergeMode && selectedTablesToMerge.includes(table.id)
                ? 'border-blue-500 bg-blue-50'
                : 
              table.status === 'occupied' ? 'border-red-500 bg-red-50' :
              table.status === 'reserved' ? 'border-yellow-500 bg-yellow-50' :
              'border-green-500 bg-green-50'
            } ${isMergeMode ? 'cursor-pointer' : ''}`}
            onClick={() => isMergeMode && toggleTableSelection(table.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Tavolo {table.number}</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                    table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {table.status === 'occupied' ? 'Occupato' :
                   table.status === 'reserved' ? 'Prenotato' : 'Libero'}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsFor(showActionsFor === table.id ? null : table.id)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  {showActionsFor === table.id && (
                    <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedTable(table);
                            setEditingTable({
                              number: table.number.toString(),
                              capacity: table.capacity.toString()
                            });
                            setShowActionsFor(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifica
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTable(table);
                            setEditingNotes(table.notes || '');
                            setIsNotesModalOpen(true);
                            setShowActionsFor(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <StickyNote className="w-4 h-4 mr-2" />
                          Note
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTableForReservation(table);
                            setIsReservationModalOpen(true);
                            setShowActionsFor(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Prenota
                        </button>
                        {table.merged_with && table.merged_with.length > 0 && (
                          <button
                            onClick={() => handleUnmergeTable(table.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Separa tavoli
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Elimina
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center text-gray-600 mb-3">
              <Users className="w-4 h-4 mr-2" />
              <span>{table.capacity} persone</span>
              {table.merged_with && table.merged_with.length > 0 && (
                <span className="ml-2 text-sm text-blue-600">
                  (Unito con {table.merged_with.length} {table.merged_with.length === 1 ? 'tavolo' : 'tavoli'})
                </span>
              )}
            </div>
            {table.notes && (
              <div className="mb-3 text-sm text-gray-600 bg-white bg-opacity-50 p-2 rounded">
                <div className="flex items-start gap-2">
                  <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="flex-1">{table.notes}</p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {table.status !== 'free' && (
                <button
                  onClick={() => handleStatusChange(table.id, 'free')}
                  className="flex-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Libera
                </button>
              )}
              {table.status !== 'occupied' && (
                <button
                  onClick={() => handleStatusChange(table.id, 'occupied')}
                  className="flex-1 px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Occupa
                </button>
              )}
              {table.status !== 'reserved' && (
                <button
                  onClick={() => handleStatusChange(table.id, 'reserved')}
                  className="flex-1 px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                >
                  Prenota
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-8 p-4 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Nuovo Tavolo</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="p-6 space-y-4">
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                  Numero tavolo
                </label>
                <input
                  type="number"
                  id="number"
                  min="1"
                  required
                  value={newTable.number}
                  onChange={(e) => setNewTable(prev => ({ ...prev, number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacità (persone)
                </label>
                <input
                  type="number"
                  id="capacity"
                  min="1"
                  required
                  value={newTable.capacity}
                  onChange={(e) => setNewTable(prev => ({ ...prev, capacity: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creazione...' : 'Crea Tavolo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Modifica Tavolo {selectedTable.number}</h2>
              <button
                onClick={() => {
                  setSelectedTable(null);
                  setEditingTable({ number: '', capacity: '' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditTable} className="p-6 space-y-4">
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                  Numero tavolo
                </label>
                <input
                  type="number"
                  id="number"
                  min="1"
                  required
                  value={editingTable.number}
                  onChange={(e) => setEditingTable(prev => ({ ...prev, number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacità (persone)
                </label>
                <input
                  type="number"
                  id="capacity"
                  min="1"
                  required
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable(prev => ({ ...prev, capacity: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTable(null);
                    setEditingTable({ number: '', capacity: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isEditing ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNotesModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Note - Tavolo {selectedTable.number}</h2>
              <button
                onClick={() => {
                  setIsNotesModalOpen(false);
                  setSelectedTable(null);
                  setEditingNotes('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="p-6">
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Inserisci le note per questo tavolo..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotesModalOpen(false);
                    setSelectedTable(null);
                    setEditingNotes('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSavingNotes}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isSavingNotes ? 'Salvataggio...' : 'Salva Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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