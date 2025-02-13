import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, ChefHat, Leaf, Wheat, Flame, X } from 'lucide-react';
import { getMenuCategories, getMenuItems, createMenuCategory, updateMenuCategory, deleteMenuCategory, createMenuItem, updateMenuItem, deleteMenuItem, type MenuCategory, type MenuItem } from '@/lib/menu';

export default function Menu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<MenuCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    order: '0',
    is_active: true
  });
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_available: true,
    preparation_time: '',
    allergens: [] as string[],
    ingredients: [] as string[],
    image_url: '',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    spiciness_level: 0
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        getMenuCategories(),
        getMenuItems()
      ]);
      setCategories(categoriesData);
      setItems(itemsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento del menu');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCategoryForEdit) {
        await updateMenuCategory(selectedCategoryForEdit.id, {
          name: categoryFormData.name,
          description: categoryFormData.description || undefined,
          order: parseInt(categoryFormData.order),
          is_active: categoryFormData.is_active
        });
      } else {
        await createMenuCategory({
          name: categoryFormData.name,
          description: categoryFormData.description || undefined,
          order: parseInt(categoryFormData.order),
          is_active: categoryFormData.is_active
        });
      }
      setIsCategoryModalOpen(false);
      setSelectedCategoryForEdit(null);
      setCategoryFormData({ name: '', description: '', order: '0', is_active: true });
      await loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio della categoria');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        name: itemFormData.name,
        description: itemFormData.description || undefined,
        price: parseFloat(itemFormData.price),
        category_id: parseInt(itemFormData.category_id),
        is_available: itemFormData.is_available,
        preparation_time: itemFormData.preparation_time || undefined,
        allergens: itemFormData.allergens,
        ingredients: itemFormData.ingredients,
        image_url: itemFormData.image_url || undefined,
        is_vegetarian: itemFormData.is_vegetarian,
        is_vegan: itemFormData.is_vegan,
        is_gluten_free: itemFormData.is_gluten_free,
        spiciness_level: itemFormData.spiciness_level
      };

      if (selectedItem) {
        await updateMenuItem(selectedItem.id, itemData);
      } else {
        await createMenuItem(itemData);
      }
      setIsItemModalOpen(false);
      setSelectedItem(null);
      setItemFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        is_available: true,
        preparation_time: '',
        allergens: [],
        ingredients: [],
        image_url: '',
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        spiciness_level: 0
      });
      await loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio del piatto');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria? Tutti i piatti associati verranno eliminati.')) return;
    try {
      await deleteMenuCategory(id);
      await loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione della categoria');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo piatto?')) return;
    try {
      await deleteMenuItem(id);
      await loadMenu();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione del piatto');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Caricamento menu...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Menu
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedCategoryForEdit(null);
              setCategoryFormData({ name: '', description: '', order: '0', is_active: true });
              setIsCategoryModalOpen(true);
            }}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuova Categoria
          </button>
          <button
            onClick={() => {
              setSelectedItem(null);
              setItemFormData({
                name: '',
                description: '',
                price: '',
                category_id: categories[0]?.id.toString() || '',
                is_available: true,
                preparation_time: '',
                allergens: [],
                ingredients: [],
                image_url: '',
                is_vegetarian: false,
                is_vegan: false,
                is_gluten_free: false,
                spiciness_level: 0
              });
              setIsItemModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuovo Piatto
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-64">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorie</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-red-50 text-red-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                Tutti i piatti
              </button>
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-red-50 text-red-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                    title={category.description || ''}
                  >
                    <span>{category.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategoryForEdit(category);
                          setCategoryFormData({
                            name: category.name,
                            description: category.description || '',
                            order: category.order.toString(),
                            is_active: category.is_active
                          });
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca nel menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring-red-500 bg-white/50 backdrop-blur-sm transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-lg font-semibold text-red-600">
                      €{item.price.toFixed(2)}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.is_vegetarian && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Leaf className="w-3 h-3 mr-1" />
                        Vegetariano
                      </span>
                    )}
                    {item.is_vegan && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Leaf className="w-3 h-3 mr-1" />
                        Vegano
                      </span>
                    )}
                    {item.is_gluten_free && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Wheat className="w-3 h-3 mr-1" />
                        Senza glutine
                      </span>
                    )}
                    {item.spiciness_level > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Flame className="w-3 h-3 mr-1" />
                        {'🌶️'.repeat(item.spiciness_level)}
                      </span>
                    )}
                  </div>

                  {item.allergens.length > 0 && (
                    <div className="text-xs text-gray-500 mb-3">
                      <strong>Allergeni:</strong> {item.allergens.join(', ')}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => {
                        setSelectedItem(item);
                        setItemFormData({
                          name: item.name,
                          description: item.description || '',
                          price: item.price.toString(),
                          category_id: item.category_id.toString(),
                          is_available: item.is_available,
                          preparation_time: item.preparation_time || '',
                          allergens: item.allergens,
                          ingredients: item.ingredients,
                          image_url: item.image_url || '',
                          is_vegetarian: item.is_vegetarian,
                          is_vegan: item.is_vegan,
                          is_gluten_free: item.is_gluten_free,
                          spiciness_level: item.spiciness_level
                        });
                        setIsItemModalOpen(true);
                      }}
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategoryForEdit ? 'Modifica Categoria' : 'Nuova Categoria'}
              </h2>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setSelectedCategoryForEdit(null);
                  setCategoryFormData({ name: '', description: '', order: '0', is_active: true });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome categoria
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrizione
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                  Ordine
                </label>
                <input
                  type="number"
                  id="order"
                  min="0"
                  required
                  value={categoryFormData.order}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, order: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={categoryFormData.is_active}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Categoria attiva
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setSelectedCategoryForEdit(null);
                    setCategoryFormData({ name: '', description: '', order: '0', is_active: true });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {selectedCategoryForEdit ? 'Salva Modifiche' : 'Crea Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Piatto */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedItem ? 'Modifica Piatto' : 'Nuovo Piatto'}
              </h2>
              <button
                onClick={() => {
                  setIsItemModalOpen(false);
                  setSelectedItem(null);
                  setItemFormData({
                    name: '',
                    description: '',
                    price: '',
                    category_id: '',
                    is_available: true,
                    preparation_time: '',
                    allergens: [],
                    ingredients: [],
                    image_url: '',
                    is_vegetarian: false,
                    is_vegan: false,
                    is_gluten_free: false,
                    spiciness_level: 0
                  });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome piatto
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descrizione
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={itemFormData.description}
                      onChange={(e) => setItemFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Prezzo
                      </label>
                      <input
                        type="number"
                        id="price"
                        step="0.01"
                        min="0"
                        required
                        value={itemFormData.price}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Categoria
                      </label>
                      <select
                        id="category"
                        required
                        value={itemFormData.category_id}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, category_id: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                      >
                        <option value="">Seleziona categoria</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="preparation_time" className="block text-sm font-medium text-gray-700">
                      Tempo di preparazione (minuti)
                    </label>
                    <input
                      type="number"
                      id="preparation_time"
                      min="1"
                      value={itemFormData.preparation_time}
                      onChange={(e) => setItemFormData(prev => ({ ...prev, preparation_time: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                      URL Immagine
                    </label>
                    <input
                      type="url"
                      id="image_url"
                      value={itemFormData.image_url}
                      onChange={(e) => setItemFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="allergens" className="block text-sm font-medium text-gray-700">
                      Allergeni (separati da virgola)
                    </label>
                    <input
                      type="text"
                      id="allergens"
                      value={itemFormData.allergens.join(', ')}
                      onChange={(e) => setItemFormData(prev => ({
                        ...prev,
                        allergens: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
                      Ingredienti (separati da virgola)
                    </label>
                    <input
                      type="text"
                      id="ingredients"
                      value={itemFormData.ingredients.join(', ')}
                      onChange={(e) => setItemFormData(prev => ({
                        ...prev,
                        ingredients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Livello di piccantezza
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setItemFormData(prev => ({ ...prev, spiciness_level: level }))}
                          className={`px-3 py-1 rounded-md ${
                            itemFormData.spiciness_level === level
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          } border`}
                        >
                          {level === 0 ? 'Non piccante' : '🌶️'.repeat(level)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_available"
                        checked={itemFormData.is_available}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
                        Disponibile
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_vegetarian"
                        checked={itemFormData.is_vegetarian}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, is_vegetarian: e.target.checked }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_vegetarian" className="ml-2 block text-sm text-gray-900">
                        Vegetariano
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_vegan"
                        checked={itemFormData.is_vegan}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, is_vegan: e.target.checked }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_vegan" className="ml-2 block text-sm text-gray-900">
                        Vegano
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_gluten_free"
                        checked={itemFormData.is_gluten_free}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, is_gluten_free: e.target.checked }))}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_gluten_free" className="ml-2 block text-sm text-gray-900">
                        Senza glutine
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setSelectedItem(null);
                    setItemFormData({
                      name: '',
                      description: '',
                      price: '',
                      category_id: '',
                      is_available: true,
                      preparation_time: '',
                      allergens: [],
                      ingredients: [],
                      image_url: '',
                      is_vegetarian: false,
                      is_vegan: false,
                      is_gluten_free: false,
                      spiciness_level: 0
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
                  {selectedItem ? 'Salva Modifiche' : 'Crea Piatto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}