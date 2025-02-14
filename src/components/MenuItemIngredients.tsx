import { useState, useEffect } from 'react';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { 
  getMenuItemIngredients, 
  updateMenuItemIngredients, 
  checkMenuItemAvailability,
  type MenuItemIngredient,
  type MenuItemAvailability
} from '@/lib/menu-inventory';
import { getInventoryItems, type InventoryItem } from '@/lib/inventory';
import type { MenuItem } from '@/lib/menu';

interface Props {
  menuItem: MenuItem;
  onUpdate?: () => void;
}

interface IngredientInput {
  inventory_item_id: string;
  quantity: string;
  unit: string;
}

export default function MenuItemIngredients({ menuItem, onUpdate }: Props) {
  const [ingredients, setIngredients] = useState<IngredientInput[]>([{ 
    inventory_item_id: '', 
    quantity: '', 
    unit: '' 
  }]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<MenuItemAvailability | null>(null);

  useEffect(() => {
    loadData();
  }, [menuItem.id]);

  const loadData = async () => {
    try {
      const [menuIngredients, inventory] = await Promise.all([
        getMenuItemIngredients(menuItem.id),
        getInventoryItems()
      ]);

      setInventoryItems(inventory);
      
      if (menuIngredients.length > 0) {
        setIngredients(
          menuIngredients.map(ing => ({
            inventory_item_id: ing.inventory_item_id.toString(),
            quantity: ing.quantity.toString(),
            unit: ing.unit
          }))
        );
      }

      const availabilityData = await checkMenuItemAvailability(menuItem.id);
      setAvailability(availabilityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli ingredienti');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { inventory_item_id: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientInput, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };

    // Se viene selezionato un ingrediente, imposta l'unità di misura automaticamente
    if (field === 'inventory_item_id') {
      const inventoryItem = inventoryItems.find(item => item.id.toString() === value);
      if (inventoryItem) {
        newIngredients[index].unit = inventoryItem.unit;
      }
    }

    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      await updateMenuItemIngredients(
        menuItem.id,
        ingredients
          .filter(ing => ing.inventory_item_id && ing.quantity)
          .map(ing => ({
            inventory_item_id: parseInt(ing.inventory_item_id),
            quantity: parseFloat(ing.quantity),
            unit: ing.unit
          }))
      );

      // Ricarica i dati per aggiornare la disponibilità
      await loadData();
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio degli ingredienti');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Caricamento ingredienti...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {availability && !availability.available && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 font-medium mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Ingredienti insufficienti</span>
          </div>
          <ul className="space-y-1 text-sm">
            {availability.missingIngredients.map((ing, index) => (
              <li key={index}>
                {ing.name}: disponibili {ing.available} {ing.unit} dei {ing.required} {ing.unit} necessari
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <select
                value={ingredient.inventory_item_id}
                onChange={(e) => updateIngredient(index, 'inventory_item_id', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
              >
                <option value="">Seleziona ingrediente</option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit} disponibili)
                  </option>
                ))}
              </select>
            </div>

            <div className="w-32">
              <div className="flex items-center">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                  className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                  placeholder="Quantità"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {ingredient.unit}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeIngredient(index)}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi ingrediente
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva ingredienti'}
          </button>
        </div>
      </form>
    </div>
  );
}