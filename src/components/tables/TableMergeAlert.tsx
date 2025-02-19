interface Props {
  selectedTablesCount: number;
  onMergeTables: () => void;
}

export default function TableMergeAlert({ selectedTablesCount, onMergeTables }: Props) {
  if (selectedTablesCount === 0) return null;

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-lg shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-red-700 font-medium">
            Tavoli selezionati: {selectedTablesCount}
          </p>
          <p className="text-sm text-red-600">
            {selectedTablesCount === 1
              ? 'Seleziona almeno un altro tavolo da unire'
              : 'Clicca "Unisci" per completare l\'operazione'}
          </p>
        </div>
        <button
          onClick={onMergeTables}
          disabled={selectedTablesCount < 2}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          Unisci
        </button>
      </div>
    </div>
  );
}