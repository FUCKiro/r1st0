import { supabase } from './supabase';

export interface InventoryIngredient {
  ingredient_name: string;
  required_quantity: number;
  available_quantity: number;
  unit: string;
}

export interface MenuItemIngredient {
  menu_item_id: number;
  inventory_item_id: number;
  quantity: number;
  unit: string;
  inventory_item: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
  };
}

export interface MenuItemAvailability {
  available: boolean;
  missingIngredients: {
    name: string;
    required: number;
    available: number;
    unit: string;
  }[];
}

// Ottiene gli ingredienti di un piatto
export async function getMenuItemIngredients(menuItemId: number): Promise<MenuItemIngredient[]> {
  const { data, error } = await supabase
    .from('menu_item_ingredients')
    .select(`
      menu_item_id,
      inventory_item_id,
      quantity,
      unit,
      inventory_item:inventory_items (
        id,
        name,
        quantity,
        unit
      )
    `)
    .eq('menu_item_id', menuItemId);

  if (error) throw error;
  
  if (!data) return [];

  return data.map(item => ({
    menu_item_id: item.menu_item_id,
    inventory_item_id: item.inventory_item_id,
    quantity: item.quantity,
    unit: item.unit,
    inventory_item: {
      id: item.inventory_item.id,
      name: item.inventory_item.name,
      quantity: item.inventory_item.quantity,
      unit: item.inventory_item.unit
    }
  }));
}

// Aggiorna gli ingredienti di un piatto
export async function updateMenuItemIngredients(
  menuItemId: number,
  ingredients: Array<{
    inventory_item_id: number;
    quantity: number;
    unit: string;
  }>
): Promise<void> {
  // Prima elimina tutti gli ingredienti esistenti
  const { error: deleteError } = await supabase
    .from('menu_item_ingredients')
    .delete()
    .eq('menu_item_id', menuItemId);

  if (deleteError) throw deleteError;

  if (ingredients.length === 0) return;

  // Poi inserisce i nuovi ingredienti
  const { error: insertError } = await supabase
    .from('menu_item_ingredients')
    .insert(
      ingredients.map(ingredient => ({
        menu_item_id: menuItemId,
        ...ingredient
      }))
    );

  if (insertError) throw insertError;
}

// Verifica la disponibilità di un piatto
export async function checkMenuItemAvailability(menuItemId: number): Promise<MenuItemAvailability> {
  const { data, error } = await supabase
    .rpc<InventoryIngredient>('check_ingredients_availability', { p_menu_item_id: menuItemId });

  if (error) throw error;

  const ingredients = data || [];
  const missingIngredients = ingredients
    .filter(ing => ing.available_quantity < ing.required_quantity)
    .map(ing => ({
      name: ing.ingredient_name,
      required: ing.required_quantity,
      available: ing.available_quantity,
      unit: ing.unit
    }));

  return {
    available: missingIngredients.length === 0,
    missingIngredients
  };
}

// Aggiorna la disponibilità di tutti i piatti
export async function updateAllMenuItemsAvailability(): Promise<void> {
  const { error } = await supabase.rpc('update_all_menu_items_availability');
  if (error) throw error;
}

// Sottoscrizione ai cambiamenti del magazzino che influenzano il menu
export function useMenuInventorySubscription(onUpdate: () => void): () => void {
  const channel = supabase
    .channel('menu-inventory')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inventory_items'
      },
      () => {
        // Aggiorna la disponibilità dei piatti quando cambia il magazzino
        updateAllMenuItemsAvailability()
          .then(onUpdate)
          .catch(console.error);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menu_item_ingredients'
      },
      onUpdate
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}