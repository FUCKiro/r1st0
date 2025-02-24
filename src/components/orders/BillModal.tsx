import { X, Receipt } from 'lucide-react';
import type { Order } from '@/lib/orders';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onConfirm: () => Promise<void>;
}

export default function BillModal({ isOpen, onClose, order, onConfirm }: Props) {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Conto - Tavolo {order.table?.number}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(order.created_at), 'PPP', { locale: it })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.menu_item?.name}</span>
                    <span className="text-gray-600 ml-2">
                      {item.menu_item?.is_weight_based && item.weight_kg
                        ? `${item.weight_kg.toFixed(3)} kg x${item.quantity}`
                        : `x${item.quantity}`
                      }
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <div className="font-medium">
                    {formatCurrency(
                      item.menu_item?.is_weight_based
                        ? ((item.menu_item?.price_per_kg || 0) * (item.weight_kg || 0)) * item.quantity
                        : ((item.menu_item?.price || 0) * item.quantity)
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.menu_item?.is_weight_based
                      ? `€${((item.menu_item?.price_per_kg || 0) / 10).toFixed(2)}/hg`
                      : `(${formatCurrency(item.menu_item?.price || 0)} cad.)`
                    }
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Totale</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Chiudi Conto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}