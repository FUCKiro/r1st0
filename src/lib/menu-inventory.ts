import { supabase } from './supabase';

export interface MenuItemIngredient {
  menu_item_id: number;
  inventory_item_id: number;
  quantity: number;
  unit: string;
  inventory_item?: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
  };
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
  return data || [];
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

export interface IngredientAvailability {
  name: string;
  required: number;
  available: number;
  unit: string;
}

export interface MenuItemAvailability {
  available: boolean;
  missingIngredients: IngredientAvailability[];
}

// Verifica la disponibilità di un piatto
export async function checkMenuItemAvailability(menuItemId: number): Promise<MenuItemAvailability> {
  const { data, error } = await supabase.rpc(
    'check_ingredients_availability',
    { p_menu_item_id: menuItemId }
  );

  if (error) throw error;

  const ingredients = data as Array<{
    ingredient_name: string;
    required_quantity: number;
    available_quantity: number;
    unit: string;
  }>;

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

export interface MenuItemWithIngredients {
  quantity: number;
  unit: string;
  menu_item: {
    id: number;
    name: string;
    price: number;
    is_available: boolean;
  };
}

// Ottiene i piatti che utilizzano un determinato ingrediente
export async function getMenuItemsByIngredient(ingredientId: number): Promise<MenuItemWithIngredients[]> {
  const { data, error } = await supabase
    .from('menu_item_ingredients')
    .select(`
      quantity,
      unit,
      menu_item:menu_items (
        id,
        name,
        price,
        is_available
      )
    `)
    .eq('inventory_item_id', ingredientId);

  if (error) throw error;
  return data || [];
}

// Aggiorna la disponibilità di tutti i piatti
export async function updateAllMenuItemsAvailability(): Promise<void> {
  const { error } = await supabase.rpc('update_all_menu_items_availability');
  if (error) throw error;
}

export interface LowStockIngredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  minimum_quantity: number;
  menu_item_ingredients: Array<{
    menu_item: {
      id: number;
      name: string;
      is_available: boolean;
    };
  }>;
}

// Ottiene gli ingredienti con scorte basse che influenzano i piatti
export async function getLowStockIngredientsWithMenuItems(): Promise<LowStockIngredient[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      id,
      name,
      quantity,
      unit,
      minimum_quantity,
      menu_item_ingredients (
        menu_item:menu_items (
          id,
          name,
          is_available
        )
      )
    `)
    .lte('quantity', supabase.raw('minimum_quantity'))
    .not('menu_item_ingredients', 'is', null);

  if (error) throw error;
  return data || [];
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