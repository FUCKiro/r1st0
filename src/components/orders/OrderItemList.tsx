import type { OrderItem } from '@/lib/orders';

interface Props {
  items: OrderItem[];
  onUpdateStatus: (itemId: number, status: OrderItem['status']) => Promise<void>;
}

export default function OrderItemList({ items, onUpdateStatus }: Props) {
  return (
    <div className="space-y-2 mb-4">
      {items?.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-start p-2 rounded-lg bg-gray-50"
        >
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium">{item.menu_item?.name}</span>
              <span className="text-sm">x{item.quantity}</span>
            </div>
            {item.notes && (
              <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
            )}
          </div>
          <div className="ml-4">
            <select
              value={item.status}
              onChange={(e) => onUpdateStatus(item.id, e.target.value as OrderItem['status'])}
              className="text-sm border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500"
            >
              <option value="pending">In attesa</option>
              <option value="preparing">In preparazione</option>
              <option value="ready">Pronto</option>
              <option value="served">Servito</option>
              <option value="cancelled">Annullato</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}