import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function MenuSearch({ value, onChange }: Props) {
  return (
    <div className="mb-6 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Cerca nel menu..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
      />
    </div>
  );
}