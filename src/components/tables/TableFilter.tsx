interface Props {
  filter: string;
  onFilterChange: (filter: string) => void;
}

export default function TableFilter({ filter, onFilterChange }: Props) {
  return (
    <div className="mb-6">
      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
      >
        <option value="all">Tutti i tavoli</option>
        <option value="free">Tavoli liberi</option>
        <option value="occupied">Tavoli occupati</option>
        <option value="reserved">Tavoli prenotati</option>
      </select>
    </div>
  );
}