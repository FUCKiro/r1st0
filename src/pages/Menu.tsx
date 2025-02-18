import { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { getMenuCategories, getMenuItems, createMenuCategory, updateMenuCategory, deleteMenuCategory, createMenuItem, updateMenuItem, deleteMenuItem, type MenuCategory, type MenuItem } from '@/lib/menu';
import MenuCategoryModal from '@/components/MenuCategoryModal';
import MenuItemModal from '@/components/MenuItemModal';
import MenuList from '@/components/MenuList';

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

          <MenuList
            items={filteredItems}
            onEdit={(item) => {
              setSelectedItem(item);
              setItemFormData({
                name: item.name,
                description: item.description || '',
                price: item.price.toString(),
                category_id: item.category_id.toString(),
                is_available: item.is_available,
                preparation_time: item.preparation_time || '',
                allergens: item.allergens,
                image_url: item.image_url || '',
                is_vegetarian: item.is_vegetarian,
                is_vegan: item.is_vegan,
                is_gluten_free: item.is_gluten_free,
                spiciness_level: item.spiciness_level
              });
              setIsItemModalOpen(true);
            }}
            onDelete={handleDeleteItem}
          />
        </div>
      </div>

      <MenuCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategoryForEdit(null);
          setCategoryFormData({ name: '', description: '', order: '0', is_active: true });
        }}
        onSubmit={handleCategorySubmit}
        formData={categoryFormData}
        setFormData={setCategoryFormData}
        selectedCategory={selectedCategoryForEdit}
      />

      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
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
            image_url: '',
            is_vegetarian: false,
            is_vegan: false,
            is_gluten_free: false,
            spiciness_level: 0
          });
        }}
        onSubmit={handleItemSubmit}
        formData={itemFormData}
        setFormData={setItemFormData}
        selectedItem={selectedItem}
        categories={categories}
      />
    </div>
  );
}