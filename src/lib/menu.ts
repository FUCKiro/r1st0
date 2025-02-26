import { supabase } from './supabase';

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  preparation_time?: string;
  allergens: string[];
  image_url?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spiciness_level: number;
  is_weight_based: boolean;
  price_per_kg?: number;
  created_at: string;
  updated_at: string;
}

export async function getMenuCategories() {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .order('order');
    
  if (error) throw error;
  return data;
}

export async function createMenuCategory(data: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>) {
  const { error } = await supabase
    .from('menu_categories')
    .insert([data]);
    
  if (error) throw error;
}

export async function updateMenuCategory(id: number, data: Partial<MenuCategory>) {
  const { error } = await supabase
    .from('menu_categories')
    .update(data)
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteMenuCategory(id: number) {
  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export async function getMenuItems(categoryId?: number) {
  let query = supabase
    .from('menu_items')
    .select(`
      *,
      menu_categories (
        name
      )
    `);
    
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data;
}

export async function createMenuItem(data: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>) {
  const { error } = await supabase
    .from('menu_items')
    .insert([{
      name: data.name,
      description: data.description || undefined,
      price: data.price,
      category_id: data.category_id,
      is_available: data.is_available,
      preparation_time: data.preparation_time || undefined,
      allergens: data.allergens,
      image_url: data.image_url || undefined,
      is_vegetarian: data.is_vegetarian,
      is_vegan: data.is_vegan,
      is_gluten_free: data.is_gluten_free,
      spiciness_level: data.spiciness_level,
      is_weight_based: data.is_weight_based,
      price_per_kg: data.price_per_kg
    }]);
    
  if (error) throw error;
}

export async function updateMenuItem(id: number, data: Partial<MenuItem>) {
  const { error } = await supabase
    .from('menu_items')
    .update(data)
    .eq('id', id);
    
  if (error) throw error;
}

export async function deleteMenuItem(id: number) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export function useMenuSubscription(onUpdate: () => void) {
  supabase
    .channel('menu_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menu_items'
      },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'menu_categories'
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}