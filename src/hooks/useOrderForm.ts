import { useState } from 'react';

interface OrderFormData {
  table_id: string;
  notes: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    notes: string;
    weight_kg?: number;
  }>;
}

const defaultFormData: OrderFormData = {
  table_id: '',
  notes: '',
  items: [{ menu_item_id: '', quantity: 1, notes: '', weight_kg: undefined }]
};

export function useOrderForm(initialData: OrderFormData = defaultFormData) {
  const [formData, setFormData] = useState<OrderFormData>(initialData);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { menu_item_id: '', quantity: 1, notes: '', weight_kg: undefined }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  return {
    formData,
    setFormData,
    addItem,
    removeItem,
    updateItem,
    resetForm
  };
}