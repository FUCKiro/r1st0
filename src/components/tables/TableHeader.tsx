import { Plus, Map, Users, Link2 } from 'lucide-react';

interface Props {
  onNewTable: () => void;
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  isMergeMode: boolean;
  onMergeModeChange: (mergeMode: boolean) => void;
  selectedTablesCount: number;
  onMergeTables: () => Promise<void>;
}

export default function TableHeader({
  onNewTable,
  viewMode,
  onViewModeChange,
  isMergeMode,
  onMergeModeChange,
  selectedTablesCount,
  onMergeTables
}: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Gestione Tavoli
        </h1>
        <button
          onClick={onNewTable}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuovo Tavolo
        </button>
      </div>
      <div>
        <button
          onClick={() => onViewModeChange(viewMode === 'list' ? 'map' : 'list')}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
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
            onMergeModeChange(!isMergeMode);
          }} 
          className={`ml-2 px-4 py-2 rounded-md text-sm font-medium ${
            isMergeMode
              ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          } ${selectedTablesCount > 1 ? 'relative' : ''}`}
        >
          <Link2 className="w-4 h-4 inline-block mr-2" />
          {isMergeMode ? (
            <>
              {selectedTablesCount > 1 ? (
                <span onClick={onMergeTables}>Unisci {selectedTablesCount} tavoli</span>
              ) : (
                'Annulla Unione'
              )}
            </>
          ) : (
            'Unisci Tavoli'
          )}
        </button>
      </div>
    </div>
  );
}