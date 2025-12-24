import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './store';
import { ItemCard } from './components/ItemCard';
import { AddEditModal } from './components/AddEditModal';
import { RestockModal } from './components/RestockModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { Toast } from './components/Toast';
import { Item } from './types';
import { Plus, Package, ShoppingBag, Check, Settings } from 'lucide-react';

const AppContent: React.FC = () => {
  const { items, lastAction, undoLastAction } = useInventory();
  const [activeTab, setActiveTab] = useState<'inventory' | 'restock'>('inventory');
  
  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItemData, setRestockItemData] = useState<Item | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const restockList = items.filter(item => item.quantity <= item.threshold);

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsAddEditOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsAddEditOpen(true);
  };

  const handleRestockClick = (item: Item) => {
    setRestockItemData(item);
    setIsRestockModalOpen(true);
  };

  const handleViewHistory = (item: Item) => {
    setHistoryItem(item);
    setIsHistoryOpen(true);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950 text-primary dark:text-zinc-100 font-sans selection:bg-accent selection:text-white transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 dark:bg-zinc-950/90 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-zinc-100 flex items-end gap-1">
            没啦 
            <div className="w-1.5 h-1.5 bg-accent rounded-full mb-1.5 animate-pulse"></div>
          </h1>
          <p className="text-[10px] text-secondary dark:text-zinc-500 font-medium tracking-wide uppercase opacity-80">Lifestyle Inventory</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-32 max-w-2xl mx-auto">
        
        {activeTab === 'inventory' ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-300 dark:text-zinc-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                   <Package size={32} className="opacity-50" />
                </div>
                <p className="text-sm font-medium">还没有物品，点击下方 "+" 添加</p>
              </div>
            ) : (
              // Sort by low stock first, then updated recently
              [...items]
                .sort((a, b) => {
                  const aLow = a.quantity <= a.threshold;
                  const bLow = b.quantity <= b.threshold;
                  if (aLow && !bLow) return -1;
                  if (!aLow && bLow) return 1;
                  return b.updatedAt - a.updatedAt;
                })
                .map(item => (
                  <ItemCard 
                    key={item.id} 
                    item={item} 
                    onEdit={handleEdit} 
                    onViewHistory={handleViewHistory}
                  />
                ))
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-800 dark:to-black rounded-3xl p-6 text-white shadow-xl shadow-zinc-200 dark:shadow-none overflow-hidden relative">
               <div className="relative z-10">
                 <h2 className="text-2xl font-bold mb-1">{restockList.length} 项</h2>
                 <p className="opacity-60 text-xs font-medium uppercase tracking-wider">待补货物品</p>
               </div>
               <ShoppingBag className="absolute right-[-10px] bottom-[-10px] text-white opacity-5 w-32 h-32 rotate-12" />
            </div>

            {restockList.length === 0 ? (
               <div className="text-center py-16 text-gray-400 dark:text-zinc-600">
                 <Check size={40} className="mx-auto mb-3 text-gray-200 dark:text-zinc-800" />
                 <p className="text-sm">库存充足，无需补货</p>
               </div>
            ) : (
              <div className="space-y-3">
                {restockList.map(item => (
                  <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 pl-5 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100/50 dark:border-zinc-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-zinc-100">{item.name}</h3>
                      </div>
                      <div className="text-xs text-secondary dark:text-zinc-500 flex gap-2">
                         <span>现存 {item.quantity}{item.unit}</span>
                         <span className="text-gray-300 dark:text-zinc-700">|</span>
                         <span>标准 {item.targetQuantity}{item.unit}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRestockClick(item)}
                      className="ml-4 w-10 h-10 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-95 transition-all shadow-sm"
                      aria-label="Restock"
                    >
                      <Check size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Undo Toast */}
      <Toast 
        isVisible={!!lastAction} 
        message={lastAction?.description || ''} 
        onUndo={undoLastAction} 
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-gray-100/50 dark:border-zinc-800 px-6 pb-safe pt-2 z-40 transition-colors duration-300">
        <div className="flex justify-between items-end max-w-md mx-auto relative h-16 pb-2">
          
          {/* Inventory Tab */}
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-2 transition-all duration-300 group ${activeTab === 'inventory' ? 'text-primary dark:text-zinc-100' : 'text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400'}`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-gray-100 dark:bg-zinc-800' : ''}`}>
               <Package size={24} strokeWidth={activeTab === 'inventory' ? 2.5 : 2} className="transition-transform group-active:scale-90" />
            </div>
            <span className="text-[10px] font-bold tracking-tight">库存</span>
          </button>

          {/* Add Button - Center Float */}
          <div className="relative -top-6 mx-2">
            <button 
              onClick={handleAddNew}
              className="w-16 h-16 bg-primary dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[20px] shadow-2xl shadow-primary/30 dark:shadow-white/10 flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-primary/50 dark:hover:shadow-white/20 ring-8 ring-background dark:ring-zinc-950"
            >
              <Plus size={32} strokeWidth={2.5} />
            </button>
          </div>

          {/* Restock Tab */}
          <button 
            onClick={() => setActiveTab('restock')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-2 transition-all duration-300 group ${activeTab === 'restock' ? 'text-accent' : 'text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400'}`}
          >
             <div className="relative">
                <div className={`p-1 rounded-xl transition-all ${activeTab === 'restock' ? 'bg-rose-50 dark:bg-rose-900/20' : ''}`}>
                  <ShoppingBag size={24} strokeWidth={activeTab === 'restock' ? 2.5 : 2} className="transition-transform group-active:scale-90" />
                </div>
                {restockList.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-white dark:border-zinc-950 rounded-full"></span>
                )}
             </div>
             <span className="text-[10px] font-bold tracking-tight">补货</span>
          </button>
        </div>
      </nav>

      <AddEditModal 
        isOpen={isAddEditOpen} 
        onClose={() => setIsAddEditOpen(false)} 
        initialData={editingItem} 
      />
      
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        item={restockItemData}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        item={historyItem}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
};

export default App;
