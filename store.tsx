import React, { createContext, useContext, useEffect, useState } from 'react';
import { Item, InventoryContextType, UsageRecord, Theme } from './types';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY = 'meila_inventory_v1';
const THEME_KEY = 'meila_theme_v1';

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inventory State
  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load inventory', e);
      return [];
    }
  });

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return (saved as Theme) || 'system';
    } catch {
      return 'system';
    }
  });

  // Inventory Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save inventory', e);
    }
  }, [items]);

  // Theme Logic
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      // Listener for system changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const addItem = (newItemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'usageHistory'>) => {
    const newItem: Item = {
      ...newItemData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageHistory: [],
    };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const adjustQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const newQuantity = Math.max(0, item.quantity + delta);
      if (newQuantity === item.quantity) return item;

      const record: UsageRecord = {
        timestamp: Date.now(),
        type: delta < 0 ? 'consume' : 'adjust',
        delta,
        previousQuantity: item.quantity,
        newQuantity,
      };

      return {
        ...item,
        quantity: newQuantity,
        usageHistory: [record, ...item.usageHistory],
        updatedAt: Date.now(),
      };
    }));
  };

  const restockItem = (id: string, newQuantity: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const delta = newQuantity - item.quantity;
      if (delta === 0) return item;

      const record: UsageRecord = {
        timestamp: Date.now(),
        type: 'restock',
        delta,
        previousQuantity: item.quantity,
        newQuantity,
      };

      return {
        ...item,
        quantity: newQuantity,
        usageHistory: [record, ...item.usageHistory],
        updatedAt: Date.now(),
      };
    }));
  };

  return (
    <InventoryContext.Provider value={{ items, theme, setTheme, addItem, updateItem, deleteItem, adjustQuantity, restockItem }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};