import { Clock, ChefHat, Receipt, Ban, CheckCircle, DollarSign, X, PlusCircle } from 'lucide-react';
import type { Order, OrderItem } from '@/lib/orders';
import type { Table } from '@/lib/tables';

interface Props {
  order: Order;
  tables: Table[];
  onUpdateOrderStatus: (orderId: number, status: Order['status']) => Promise<void>;
  onUpdateOrderItemStatus: (itemId: number, status: OrderItem['status']) => Promise<void>;
  onAddItems: (orderId: number) => void;
  onDelete: (id: number) => Promise<void>;
}

export default function OrderCard({
  order,
  tables,
  onUpdateOrderStatus,
  onUpdateOrderItemStatus,
  onAddItems,
  onDelete
}: Props) {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-purple-100 text-purple-800';
      case 'paid': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'served': return <Receipt className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      case 'cancelled': return <Ban className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tavolo {order.table?.number}
              {order.table?.merged_with && order.table.merged_with.length > 0 && (
                <span className="ml-2 text-sm text-blue-600">
                  (Unito con {order.table.merged_with.map(id => {
                    const mergedTable = tables.find(t => t.id === id);
                    return mergedTable ? mergedTable.number : id;
                  }).join(', ')})
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              Ordine #{order.id}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {order.status === 'pending' ? 'In attesa' :
             order.status === 'preparing' ? 'In preparazione' :
             order.status === 'ready' ? 'Pronto' :
             order.status === 'served' ? 'Servito' :
             order.status === 'paid' ? 'Pagato' :
             'Annullato'}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {order.items?.map((item) => (
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
                  onChange={(e) => onUpdateOrderItemStatus(item.id, e.target.value as OrderItem['status'])}
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
        
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => onAddItems(order.id)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" />
            Aggiungi piatti
          </button>
        </div>

        {order.notes && (
          <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
            <strong>Note:</strong> {order.notes}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold">
            Totale: €{order.total_amount.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <select
              value={order.status}
              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
              className="text-sm border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500"
            >
              <option value="pending">In attesa</option>
              <option value="preparing">In preparazione</option>
              <option value="ready">Pronto</option>
              <option value="served">Servito</option>
              <option value="paid">Pagato</option>
              <option value="cancelled">Annullato</option>
            </select>
            <button
              onClick={() => onDelete(order.id)}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}