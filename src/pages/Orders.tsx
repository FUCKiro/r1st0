import { useState, useEffect } from 'react';
import { getOrders, createOrder, addToOrder, updateOrderStatus, updateOrderItemStatus, deleteOrder, useOrdersSubscription, type Order } from '@/lib/orders';
import { getTables, type Table } from '@/lib/tables';
import { getMenuItems, getMenuCategories, type MenuItem, type MenuCategory } from '@/lib/menu';
import OrderHeader from '@/components/orders/OrderHeader';
import OrderSearch from '@/components/orders/OrderSearch';
import OrderList from '@/components/orders/OrderList';
import OrderModal from '@/components/orders/OrderModal';
import BillModal from '@/components/orders/BillModal';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddToOrderModalOpen, setIsAddToOrderModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newOrder, setNewOrder] = useState({
    table_id: '',
    notes: '',
    items: [{ menu_item_id: '', quantity: 1, notes: '' }]
  });

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [ordersData, tablesData, itemsData, categoriesData] = await Promise.all([
          getOrders(),
          getTables(),
          getMenuItems(),
          getMenuCategories()
        ]);
        
        setOrders(ordersData);
        setTables(tablesData);
        setMenuItems(itemsData);
        setCategories(categoriesData);
        
        if (categoriesData.length > 0) {
          setSelectedCategoryId(categoriesData[0].id);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    useOrdersSubscription(async () => {
      const data = await getOrders();
      setOrders(data);
    });
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({
        table_id: parseInt(newOrder.table_id),
        notes: newOrder.notes || undefined,
        items: newOrder.items
          .filter(item => item.menu_item_id && item.quantity > 0)
          .map(item => ({
            menu_item_id: parseInt(item.menu_item_id),
            quantity: item.quantity,
            notes: item.notes || undefined
          }))
      });
      setIsModalOpen(false);
      setNewOrder({
        table_id: '',
        notes: '',
        items: [{ menu_item_id: '', quantity: 1, notes: '' }]
      });
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione dell\'ordine');
    }
  };

  const handleAddToOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    try {
      await addToOrder(
        selectedOrderId,
        newOrder.items
          .filter(item => item.menu_item_id && item.quantity > 0)
          .map(item => ({
            menu_item_id: parseInt(item.menu_item_id),
            quantity: item.quantity,
            notes: item.notes || undefined
          }))
      );
      setIsAddToOrderModalOpen(false);
      setSelectedOrderId(null);
      setNewOrder({
        table_id: '',
        notes: '',
        items: [{ menu_item_id: '', quantity: 1, notes: '' }]
      });
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiunta di piatti all\'ordine');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento dell\'ordine');
    }
  };

  const handleUpdateOrderItemStatus = async (itemId: number, status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled') => {
    try {
      await updateOrderItemStatus(itemId, status);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento dell\'elemento');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return;
    try {
      await deleteOrder(id);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione dell\'ordine');
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
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella chiusura del conto');
    }
  };

  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { menu_item_id: '', quantity: 1, notes: '' }]
    }));
  };

  const removeOrderItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index: number, field: string, value: string | number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
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
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onUpdateOrderItemStatus={handleUpdateOrderItemStatus}
          onAddItems={(orderId) => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;
            
            setSelectedOrderId(orderId);
            setNewOrder({
              table_id: order.table_id.toString(),
              notes: '',
              items: [{ menu_item_id: '', quantity: 1, notes: '' }]
            });
            setIsAddToOrderModalOpen(true);
          }}
          onShowBill={handleShowBill}
          onDelete={handleDeleteOrder}
        />
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewOrder({
            table_id: '',
            notes: '',
            items: [{ menu_item_id: '', quantity: 1, notes: '' }]
          });
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
          setNewOrder({
            table_id: '',
            notes: '',
            items: [{ menu_item_id: '', quantity: 1, notes: '' }]
          });
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