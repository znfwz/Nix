import React, { createContext, useContext, useEffect, useState } from 'react';
import { Item, InventoryContextType, UsageRecord, Theme } from './types';
import { generateId } from './utils';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEY = 'meila_inventory_v1';
const THEME_KEY = 'meila_theme_v1';

interface ActionState {
  description: string;
  undoData: {
    itemId: string;
    timestamp: number;
  };
}

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

  // Undo State
  const [lastAction, setLastAction] = useState<ActionState | null>(null);

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

  // Auto-clear toast
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const addItem = (newItemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'usageHistory'>) => {
    const newItem: Item = {
      ...newItemData,
      id: generateId(),
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
    const timestamp = Date.now();
    const item = items.find(i => i.id === id);
    
    // We update state if item exists and quantity changes
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const newQuantity = Math.max(0, item.quantity + delta);
      if (newQuantity === item.quantity) return item;

      const record: UsageRecord = {
        timestamp,
        type: delta < 0 ? 'consume' : 'adjust',
        delta,
        previousQuantity: item.quantity,
        newQuantity,
      };

      return {
        ...item,
        quantity: newQuantity,
        usageHistory: [record, ...item.usageHistory],
        updatedAt: timestamp,
      };
    }));

    if (item) {
      // Check if actual change would happen (logic duplication but safe enough for UI trigger)
      if (Math.max(0, item.quantity + delta) !== item.quantity) {
        setLastAction({
          description: delta > 0 ? `已增加 ${item.name}` : `已减少 ${item.name}`,
          undoData: { itemId: id, timestamp }
        });
      }
    }
  };

  const undoLastAction = () => {
    if (!lastAction) return;
    const { itemId, timestamp } = lastAction.undoData;
    
    // Skip undo for import actions (id is 'import-batch')
    if (itemId === 'import-batch') {
      setLastAction(null);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      // Check if the latest history entry matches our undo target
      if (item.usageHistory.length === 0) return item;
      const lastRecord = item.usageHistory[0];
      
      // Ensure we are undoing the exact same action
      if (lastRecord.timestamp !== timestamp) return item;

      return {
        ...item,
        quantity: lastRecord.previousQuantity,
        usageHistory: item.usageHistory.slice(1), // Remove the last record
        updatedAt: Date.now(),
      };
    }));
    
    setLastAction(null);
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

  const importData = (newItems: Item[]) => {
    setItems(prevItems => {
      // Create a map from existing items for easy lookup and update
      const itemMap = new Map(prevItems.map(item => [item.id, item]));
      
      newItems.forEach(item => {
        // Basic validation
        if (!item.id || !item.name) return;

        // Ensure types are correct after import (CSV parsing might result in strings)
        // Also handling optional fields
        const processedItem: Item = {
          ...item,
          quantity: Number(item.quantity) || 0,
          threshold: Number(item.threshold) || 0,
          targetQuantity: Number(item.targetQuantity) || 0,
          createdAt: Number(item.createdAt) || Date.now(),
          updatedAt: Number(item.updatedAt) || Date.now(),
          expirationDate: item.expirationDate ? Number(item.expirationDate) : undefined,
          // Ensure usageHistory is an array, parsing if it came in as string in some weird edge case,
          // but assuming the importer handles the JSON parsing.
          usageHistory: Array.isArray(item.usageHistory) ? item.usageHistory : []
        };
        
        // Merge strategy: Overwrite by ID
        itemMap.set(processedItem.id, processedItem);
      });

      return Array.from(itemMap.values());
    });

    setLastAction({
      description: `已导入 ${newItems.length} 个物品`,
      undoData: { itemId: 'import-batch', timestamp: Date.now() }
    });
  };

  return (
    <InventoryContext.Provider value={{ items, theme, setTheme, addItem, updateItem, deleteItem, adjustQuantity, restockItem, undoLastAction, lastAction, importData }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
