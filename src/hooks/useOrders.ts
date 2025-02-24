import { useState, useEffect } from 'react';
import { getOrders, createOrder, addToOrder, updateOrderStatus, updateOrderItemStatus, deleteOrder, useOrdersSubscription, type Order } from '@/lib/orders';
import { getTables, type Table } from '@/lib/tables';
import { getMenuItems, getMenuCategories, type MenuItem, type MenuCategory } from '@/lib/menu';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);

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

  const handleCreateOrder = async (data: {
    table_id: string;
    notes: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      weight_kg?: number;
      notes: string;
    }>;
  }) => {
    try {
      await createOrder({
        table_id: parseInt(data.table_id),
        notes: data.notes || undefined,
        items: data.items
          .filter(item => item.menu_item_id && item.quantity > 0)
          .map(item => ({
            menu_item_id: parseInt(item.menu_item_id),
            quantity: item.quantity,
            weight_kg: item.weight_kg,
            notes: item.notes || undefined
          }))
      });
      const updatedOrders = await getOrders();
      setOrders(updatedOrders);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione dell\'ordine');
      return false;
    }
  };

  const handleAddToOrder = async (orderId: number, items: Array<{
    menu_item_id: string;
    quantity: number;
    weight_kg?: number;
    notes: string;
  }>) => {
    try {
      await addToOrder(
        orderId,
        items
          .filter(item => item.menu_item_id && item.quantity > 0)
          .map(item => ({
            menu_item_id: parseInt(item.menu_item_id),
            quantity: item.quantity,
            weight_kg: item.weight_kg,
            notes: item.notes || undefined
          }))
      );
      const updatedOrders = await getOrders();
      setOrders(updatedOrders);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiunta di piatti all\'ordine');
      return false;
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      const updatedOrders = await getOrders();
      setOrders(updatedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento dell\'ordine');
    }
  };

  const handleUpdateOrderItemStatus = async (itemId: number, status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled') => {
    try {
      await updateOrderItemStatus(itemId, status);
      setOrders(await getOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento dell\'elemento');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return;
    try {
      await deleteOrder(id);
      setOrders(await getOrders());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione dell\'ordine');
    }
  };

  return {
    orders,
    loading,
    error,
    tables,
    menuItems,
    categories,
    createOrder: handleCreateOrder,
    addToOrder: handleAddToOrder,
    updateOrderStatus: handleUpdateOrderStatus,
    updateOrderItemStatus: handleUpdateOrderItemStatus,
    deleteOrder: handleDeleteOrder,
  };
}