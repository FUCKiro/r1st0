import { useState } from 'react';
import { type Order } from '@/lib/orders';
import { useOrders } from '@/hooks/useOrders';
import { useOrderForm } from '@/hooks/useOrderForm';
import OrderHeader from '@/components/orders/OrderHeader';
import OrderSearch from '@/components/orders/OrderSearch';
import OrderList from '@/components/orders/OrderList';
import OrderModal from '@/components/orders/OrderModal';
import BillModal from '@/components/orders/BillModal';

export default function Orders() {
  const {
    orders,
    loading,
    error,
    tables,
    menuItems,
    categories,
    createOrder,
    addToOrder,
    updateOrderStatus,
    updateOrderItemStatus,
    deleteOrder
  } = useOrders();

  const {
    formData: newOrder,
    setFormData: setNewOrder,
    addItem: addOrderItem,
    removeItem: removeOrderItem,
    updateItem: updateOrderItem,
    resetForm: resetOrderForm
  } = useOrderForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddToOrderModalOpen, setIsAddToOrderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder(newOrder);
      setIsModalOpen(false);
      resetOrderForm();
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  const handleAddToOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      await addToOrder(selectedOrderId, newOrder.items);
      setIsAddToOrderModalOpen(false);
      setSelectedOrderId(null);
      resetOrderForm();
    } catch (err) {
      console.error('Error adding to order:', err);
    }
  };

  const handleShowBill = (order: Order) => {
    setSelectedOrder(order);
    setIsBillModalOpen(true);
  };

  const handleCloseBill = async () => {
    if (!selectedOrder) return;

    try {
      await updateOrderStatus(selectedOrder.id, 'paid');
      setIsBillModalOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error closing bill:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.table?.number.toString().includes(searchQuery) ||
      order.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some(item => 
        item.menu_item?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesFilter = filter === 'all' || order.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Caricamento ordini...</div>
      </div>
    );
  }

  return (
    <div>
      <OrderHeader
        onNewOrder={() => setIsModalOpen(true)}
        filter={filter}
        onFilterChange={setFilter}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-6">
        <OrderSearch value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="mt-6">
        <OrderList
          orders={filteredOrders}
          tables={tables}
          onUpdateOrderStatus={updateOrderStatus}
          onUpdateOrderItemStatus={updateOrderItemStatus}
          onAddItems={(orderId) => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;
            
            setSelectedOrderId(orderId);
            setNewOrder({
              table_id: order.table_id.toString(),
              notes: '',
              items: [{ menu_item_id: '', quantity: 1, notes: '', weight_kg: undefined }]
            });
            setIsAddToOrderModalOpen(true);
          }}
          onShowBill={handleShowBill}
          onDelete={deleteOrder}
        />
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetOrderForm();
        }}
        onSubmit={handleCreateOrder}
        tables={tables}
        categories={categories}
        menuItems={menuItems}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        formData={newOrder}
        onUpdateFormData={setNewOrder}
        onAddItem={addOrderItem}
        onRemoveItem={removeOrderItem}
        onUpdateItem={updateOrderItem}
        title="Nuovo Ordine"
        submitText="Crea Ordine"
      />

      <OrderModal
        isOpen={isAddToOrderModalOpen && selectedOrderId !== null}
        onClose={() => {
          setIsAddToOrderModalOpen(false);
          setSelectedOrderId(null);
          resetOrderForm();
        }}
        onSubmit={handleAddToOrder}
        tables={tables}
        categories={categories}
        menuItems={menuItems}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        formData={newOrder}
        onUpdateFormData={setNewOrder}
        onAddItem={addOrderItem}
        onRemoveItem={removeOrderItem}
        onUpdateItem={updateOrderItem}
        title={`Aggiungi piatti all'ordine #${selectedOrderId}`}
        submitText="Aggiungi all'ordine"
      />

      {selectedOrder && (
        <BillModal
          isOpen={isBillModalOpen}
          onClose={() => {
            setIsBillModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onConfirm={handleCloseBill}
        />
      )}
    </div>
  );
}