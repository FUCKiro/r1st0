import { Clock, ChefHat, Ban, CheckCircle, DollarSign, X, PlusCircle, Receipt } from 'lucide-react';
import type { Order, OrderItem } from '@/lib/orders';
import type { Table } from '@/lib/tables';
import OrderItemList from './OrderItemList';

interface Props {
  order: Order;
  tables: Table[];
  onUpdateOrderStatus: (orderId: number, status: Order['status']) => void;
  onUpdateOrderItemStatus: (itemId: number, status: OrderItem['status']) => Promise<void>;
  onAddItems: (orderId: number) => void;
  onShowBill: (order: Order) => void;
  onDelete: (orderId: number) => void;
}

export default function OrderCard({
  order,
  tables,
  onUpdateOrderStatus,
  onUpdateOrderItemStatus,
  onAddItems,
  onShowBill,
  onDelete
}: Props) {
  const table = tables.find(t => t.id === order.table_id);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">Ordine #{order.id}</h3>
          <span className="text-sm text-gray-600">
            Tavolo {table?.number || 'N/A'}
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onAddItems(order.id)}
            className="text-green-500 hover:text-green-600 transition-colors"
            title="Aggiungi piatti"
          >
            <PlusCircle size={20} />
          </button>
          {order.status === 'served' && (
            <button
              onClick={() => onShowBill(order)}
              className="text-blue-500 hover:text-blue-600 transition-colors"
              title="Chiudi conto"
            >
              <Receipt size={20} />
            </button>
          )}
          <button
            onClick={() => onDelete(order.id)}
            className="text-red-500 hover:text-red-600 transition-colors"
            title="Elimina ordine"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {order.notes && (
        <div className="bg-gray-50 p-2 rounded-lg mb-4">
          <span className="text-sm text-gray-600">{order.notes}</span>
        </div>
      )}

      <OrderItemList
        items={order.items || []}
        onUpdateStatus={onUpdateOrderItemStatus}
      />

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          {order.status === 'pending' && <Clock size={16} className="text-yellow-500" />}
          {order.status === 'preparing' && <ChefHat size={16} className="text-blue-500" />}
          {order.status === 'ready' && <CheckCircle size={16} className="text-green-500" />}
          {order.status === 'paid' && <DollarSign size={16} className="text-green-500" />}
          {order.status === 'cancelled' && <Ban size={16} className="text-red-500" />}
          <span className="text-sm capitalize">{order.status}</span>
        </div>

        <div>
          <select
            value={order.status}
            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
            className="text-sm border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500"
          >
            <option value="pending">In attesa</option>
            <option value="preparing">In preparazione</option>
            <option value="ready">Pronto</option>
            <option value="paid">Pagato</option>
            <option value="cancelled">Annullato</option>
          </select>
        </div>
      </div>
    </div>
  );
}