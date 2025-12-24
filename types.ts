export interface UsageRecord {
  timestamp: number;
  type: 'consume' | 'restock' | 'adjust';
  delta: number; // Negative for consumption, positive for restock
  previousQuantity: number;
  newQuantity: number;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  threshold: number; // Low stock warning level (e.g., when to buy)
  targetQuantity: number; // Stores the initial quantity (first added quantity) as the default restock amount
  unit: string; // e.g., "个", "包", "L"
  expirationDate?: number; // Optional expiration timestamp
  usageHistory: UsageRecord[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark' | 'system';

export type InventoryContextType = {
  items: Item[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'usageHistory'>) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  adjustQuantity: (id: string, delta: number) => void;
  restockItem: (id: string, newQuantity: number) => void;
  undoLastAction: () => void;
  lastAction: { description: string } | null;
  importData: (items: Item[]) => void;
};
