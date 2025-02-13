import { useState, useEffect } from 'react';
import { Plus, Search, Clock, ChefHat, Receipt, Ban, CheckCircle, DollarSign, X, PlusCircle } from 'lucide-react';
import { getOrders, createOrder, addToOrder, updateOrderStatus, updateOrderItemStatus, deleteOrder, useOrdersSubscription, type Order } from '@/lib/orders';
import { getTables, type Table } from '@/lib/tables';
import { getMenuItems, getMenuCategories, type MenuItem, type MenuCategory } from '@/lib/menu';

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

  useEffect(() => {
    loadOrders();
    loadTables();
    loadMenuData();
  }, []);

  useEffect(() => {
    // Seleziona la prima categoria disponibile all'avvio
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    useOrdersSubscription(loadOrders);
  }, []);

  const loadMenuData = async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getMenuItems(),
        getMenuCategories()
      ]);
      setMenuItems(itemsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading menu data:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli ordini');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

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
      await loadOrders();
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
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiunta di piatti all\'ordine');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento dell\'ordine');
    }
  };

  const handleUpdateOrderItemStatus = async (itemId: number, status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled') => {
    try {
      await updateOrderItemStatus(itemId, status);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento dell\'elemento');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return;
    try {
      await deleteOrder(id);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione dell\'ordine');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Caricamento ordini...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Ordini
        </h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Order['status'] | 'all')}
            className="rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
          >
            <option value="all">Tutti gli stati</option>
            <option value="pending">In attesa</option>
            <option value="preparing">In preparazione</option>
            <option value="ready">Pronti</option>
            <option value="served">Serviti</option>
            <option value="paid">Pagati</option>
            <option value="cancelled">Annullati</option>
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuovo Ordine
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cerca ordini..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tavolo {order.table?.number}
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
                        onChange={(e) => handleUpdateOrderItemStatus(item.id, e.target.value as any)}
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
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setNewOrder({
                      table_id: order.table_id.toString(),
                      notes: '',
                      items: [{ menu_item_id: '', quantity: 1, notes: '' }]
                    });
                    setIsAddToOrderModalOpen(true);
                  }}
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
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
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
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Nuovo Ordine
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewOrder({
                    table_id: '',
                    notes: '',
                    items: [{ menu_item_id: '', quantity: 1, notes: '' }]
                  });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6">
              <div className="flex gap-4">
                <div className="w-1/3 space-y-4">
                  <div>
                    <label htmlFor="table" className="block text-sm font-medium text-gray-700">
                      Tavolo
                    </label>
                    <select
                      id="table"
                      required
                      value={newOrder.table_id}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, table_id: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="">Seleziona tavolo</option>
                      {tables.map(table => (
                        <option key={table.id} value={table.id}>
                          Tavolo {table.number} ({table.capacity} posti)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Note ordine
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={newOrder.notes}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                      placeholder="Note opzionali per l'ordine..."
                    />
                  </div>
                </div>

                <div className="w-2/3 border-l border-gray-200 pl-4">
                  <div className="flex gap-4 h-[calc(100vh-20rem)] overflow-hidden">
                    <div className="w-48 border-r border-gray-200 pr-4 space-y-2 overflow-y-auto">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategoryId(category.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                            selectedCategoryId === category.id
                              ? 'bg-red-50 text-red-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <div className="flex justify-end mb-4">
                        <button
                          type="button"
                          onClick={addOrderItem}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Aggiungi piatto
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {newOrder.items.map((item, index) => (
                          <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <select
                                required
                                value={item.menu_item_id}
                                onChange={(e) => updateOrderItem(index, 'menu_item_id', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 [&_*]:text-left"
                              >
                                <option value="">Seleziona piatto</option>
                                {menuItems
                                  .filter(menuItem => menuItem.category_id === selectedCategoryId)
                                  .map(menuItem => (
                                    <option key={menuItem.id} value={menuItem.id}>
                                      {menuItem.name} - €{menuItem.price.toFixed(2)}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="w-20">
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeOrderItem(index)}
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewOrder({
                      table_id: '',
                      notes: '',
                      items: [{ menu_item_id: '', quantity: 1, notes: '' }]
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Crea Ordine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aggiungi all'Ordine */}
      {isAddToOrderModalOpen && selectedOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Aggiungi piatti all'ordine #{selectedOrderId}
              </h2>
              <button
                onClick={() => {
                  setIsAddToOrderModalOpen(false);
                  setSelectedOrderId(null);
                  setNewOrder({
                    table_id: '',
                    notes: '',
                    items: [{ menu_item_id: '', quantity: 1, notes: '' }]
                  });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddToOrder} className="p-6">
              <div className="flex gap-4 h-[calc(100vh-15rem)] overflow-hidden">
                <div className="w-48 border-r border-gray-200 pr-4 space-y-2 overflow-y-auto">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                        selectedCategoryId === category.id
                          ? 'bg-red-50 text-red-700 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={addOrderItem}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Aggiungi piatto
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <select
                            required
                            value={item.menu_item_id}
                            onChange={(e) => updateOrderItem(index, 'menu_item_id', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 [&_*]:text-left"
                          >
                            <option value="">Seleziona piatto</option>
                            {menuItems
                              .filter(menuItem => menuItem.category_id === selectedCategoryId)
                              .map(menuItem => (
                                <option key={menuItem.id} value={menuItem.id}>
                                  {menuItem.name} - €{menuItem.price.toFixed(2)}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddToOrderModalOpen(false);
                    setSelectedOrderId(null);
                    setNewOrder({
                      table_id: '',
                      notes: '',
                      items: [{ menu_item_id: '', quantity: 1, notes: '' }]
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Aggiungi all'ordine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}