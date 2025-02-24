import type { Order, OrderItem } from '@/lib/orders';
import type { Table } from '@/lib/tables';
import OrderCard from './OrderCard';

interface Props {
  orders: Order[];
  tables: Table[];
  onUpdateOrderStatus: (orderId: number, status: Order['status']) => Promise<void>;
  onUpdateOrderItemStatus: (itemId: number, status: OrderItem['status']) => Promise<void>;
  onAddItems: (orderId: number) => void;
  onShowBill: (order: Order) => void;
  onDelete: (id: number) => Promise<void>;
}

export default function OrderList({
  orders,
  tables,
  onUpdateOrderStatus,
  onUpdateOrderItemStatus,
  onAddItems,
  onShowBill,
  onDelete
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          tables={tables}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onUpdateOrderItemStatus={onUpdateOrderItemStatus}
          onAddItems={onAddItems}
          onShowBill={onShowBill}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}