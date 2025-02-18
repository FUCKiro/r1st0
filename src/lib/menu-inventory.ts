import { supabase } from './supabase';

export interface MenuItemIngredient {
  id: number;
  menu_item_id: number;
  inventory_item_id: number;
  quantity: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItemIngredientWithDetails extends MenuItemIngredient {
  inventory_item: {
    name: string;
    quantity: number;
    unit: string;
  };
}

export async function getMenuItemIngredients(menuItemId: number): Promise<MenuItemIngredientWithDetails[]> {
  const { data, error } = await supabase
    .from('menu_item_ingredients')
    .select(`
      *,
      inventory_item:inventory_items(name, quantity, unit)
    `)
    .eq('menu_item_id', menuItemId);

  if (error) throw error;
  return data || [];
}

export async function addMenuItemIngredient(data: {
  menu_item_id: number;
  inventory_item_id: number;
  quantity: number;
  unit: string;
}): Promise<void> {
  const { error } = await supabase
    .from('menu_item_ingredients')
    .insert([data]);

  if (error) throw error;
}

export async function updateMenuItemIngredient(
  id: number,
  data: {
    quantity: number;
    unit: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('menu_item_ingredients')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMenuItemIngredient(id: number): Promise<void> {
  const { error } = await supabase
    .from('menu_item_ingredients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function checkIngredientAvailability(menuItemId: number): Promise<{
  available: boolean;
  missingIngredients: Array<{
    name: string;
    required: number;
    available: number;
    unit: string;
  }>;
}> {
  const { data, error } = await supabase
    .rpc('check_ingredients_availability', {
      p_menu_item_id: menuItemId
    });

  if (error) throw error;

  const missingIngredients = data
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