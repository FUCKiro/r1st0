import { useState, useEffect } from 'react';
import MenuHeader from '@/components/menu/MenuHeader';
import MenuCategories from '@/components/menu/MenuCategories';
import MenuSearch from '@/components/menu/MenuSearch';
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
    spiciness_level: 0,
    is_weight_based: false,
    price_per_kg: ''
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
        price: itemFormData.is_weight_based ? 0 : parseFloat(itemFormData.price || '0'),
        category_id: parseInt(itemFormData.category_id),
        is_available: itemFormData.is_available,
        preparation_time: itemFormData.preparation_time || undefined,
        allergens: itemFormData.allergens,
        image_url: itemFormData.image_url || undefined,
        is_vegetarian: itemFormData.is_vegetarian,
        is_vegan: itemFormData.is_vegan,
        is_gluten_free: itemFormData.is_gluten_free,
        spiciness_level: itemFormData.spiciness_level,
        is_weight_based: itemFormData.is_weight_based,
        price_per_kg: itemFormData.is_weight_based ? parseFloat(itemFormData.price_per_kg || '0') * 10 : undefined // Convert hg price to kg price
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
        spiciness_level: 0,
        is_weight_based: false,
        price_per_kg: ''
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
      <MenuHeader
        onNewCategory={() => {
          setSelectedCategoryForEdit(null);
          setCategoryFormData({ name: '', description: '', order: '0', is_active: true });
          setIsCategoryModalOpen(true);
        }}
        onNewItem={() => {
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
            spiciness_level: 0,
            is_weight_based: false,
            price_per_kg: '',
          });
          setIsItemModalOpen(true);
        }}
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-64">
          <MenuCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onEditCategory={(category) => {
              setSelectedCategoryForEdit(category);
              setCategoryFormData({
                name: category.name,
                description: category.description || '',
                order: category.order.toString(),
                is_active: category.is_active
              });
              setIsCategoryModalOpen(true);
            }}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>

        <div className="flex-1">
          <MenuSearch value={searchQuery} onChange={setSearchQuery} />

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
                spiciness_level: item.spiciness_level,
                is_weight_based: item.is_weight_based,
                price_per_kg: item.price_per_kg?.toString() || '',
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
            spiciness_level: 0,
            is_weight_based: false,
            price_per_kg: ''
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