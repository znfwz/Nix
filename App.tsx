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
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink-main dark:text-ink-mainDark font-sans selection:bg-brand selection:text-white transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-canvas/90 dark:bg-canvas-dark/90 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between transition-colors duration-300 border-b border-gray-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <img 
            src="nix.png" 
            alt="App Icon" 
            className="w-11 h-11 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 object-cover"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink-main dark:text-ink-mainDark flex items-end gap-1">
              没啦 
              <div className="w-2 h-2 bg-brand dark:bg-brand-dark rounded-full mb-1.5 animate-pulse"></div>
            </h1>
            <p className="text-[10px] text-brand dark:text-brand-dark font-bold tracking-widest uppercase opacity-80">Smart Inventory</p>
          </div>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full text-ink-sec dark:text-ink-secDark hover:bg-surface dark:hover:bg-surface-dark transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-32 max-w-2xl mx-auto mt-4">
        
        {activeTab === 'inventory' ? (
          <div className="space-y-3 animate-in fade-in duration-300">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-ink-sec dark:text-ink-secDark">
                <div className="w-20 h-20 bg-surface dark:bg-surface-dark rounded-full flex items-center justify-center mb-6">
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
            <div className="bg-gradient-to-br from-brand-dark to-brand dark:from-surface-dark dark:to-surface-dark dark:border dark:border-zinc-700 rounded-3xl p-6 text-white shadow-xl shadow-brand/20 dark:shadow-none overflow-hidden relative">
               <div className="relative z-10">
                 <h2 className="text-3xl font-black mb-1">{restockList.length} <span className="text-lg font-medium opacity-80">项</span></h2>
                 <p className="text-white/80 dark:text-ink-secDark text-xs font-bold uppercase tracking-wider">待补货清单</p>
               </div>
               <ShoppingBag className="absolute right-[-15px] bottom-[-20px] text-white opacity-10 dark:opacity-5 w-36 h-36 rotate-12" />
            </div>

            {restockList.length === 0 ? (
               <div className="text-center py-16 text-ink-sec dark:text-ink-secDark">
                 <Check size={40} className="mx-auto mb-3 text-gray-200 dark:text-zinc-800" />
                 <p className="text-sm">库存充足，无需补货</p>
               </div>
            ) : (
              <div className="space-y-3">
                {restockList.map(item => (
                  <div key={item.id} className="bg-surface dark:bg-surface-dark p-4 pl-5 rounded-2xl flex items-center justify-between shadow-sm border border-transparent dark:border-zinc-800/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-ink-main dark:text-ink-mainDark">{item.name}</h3>
                      </div>
                      <div className="text-xs text-ink-sec dark:text-ink-secDark flex gap-2">
                         <span className="text-warning-dark dark:text-warning-dark font-medium">现存 {item.quantity}{item.unit}</span>
                         <span className="text-gray-300 dark:text-zinc-700">|</span>
                         <span>标准 {item.targetQuantity}{item.unit}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRestockClick(item)}
                      className="ml-4 w-10 h-10 bg-brand/10 dark:bg-brand-dark/20 text-brand dark:text-brand-dark rounded-xl flex items-center justify-center hover:bg-brand hover:text-white dark:hover:bg-brand-dark dark:hover:text-white active:scale-95 transition-all"
                      aria-label="Restock"
                    >
                      <Check size={20} strokeWidth={3} />
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
      <nav className="fixed bottom-0 left-0 right-0 bg-canvas/90 dark:bg-canvas-dark/90 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 px-6 pb-safe pt-2 z-40 transition-colors duration-300">
        <div className="flex justify-between items-end max-w-md mx-auto relative h-16 pb-2">
          
          {/* Inventory Tab */}
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-2 transition-all duration-300 group ${activeTab === 'inventory' ? 'text-brand dark:text-brand-dark' : 'text-ink-sec dark:text-ink-secDark hover:text-ink-main dark:hover:text-ink-mainDark'}`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-brand/10 dark:bg-brand-dark/10' : ''}`}>
               <Package size={24} strokeWidth={activeTab === 'inventory' ? 2.5 : 2} className="transition-transform group-active:scale-90" />
            </div>
            <span className="text-[10px] font-bold tracking-tight">库存</span>
          </button>

          {/* Add Button - Center Float */}
          <div className="relative -top-6 mx-2">
            <button 
              onClick={handleAddNew}
              className="w-16 h-16 bg-brand dark:bg-brand-dark text-white rounded-[24px] shadow-glow dark:shadow-glow-dark flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg ring-8 ring-canvas dark:ring-canvas-dark"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          {/* Restock Tab */}
          <button 
            onClick={() => setActiveTab('restock')}
            className={`flex-1 flex flex-col items-center gap-1.5 py-2 transition-all duration-300 group ${activeTab === 'restock' ? 'text-brand dark:text-brand-dark' : 'text-ink-sec dark:text-ink-secDark hover:text-ink-main dark:hover:text-ink-mainDark'}`}
          >
             <div className="relative">
                <div className={`p-1 rounded-xl transition-all ${activeTab === 'restock' ? 'bg-brand/10 dark:bg-brand-dark/10' : ''}`}>
                  <ShoppingBag size={24} strokeWidth={activeTab === 'restock' ? 2.5 : 2} className="transition-transform group-active:scale-90" />
                </div>
                {restockList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-warning dark:bg-warning-dark text-warning-text dark:text-warning-darkText text-[9px] font-black rounded-full flex items-center justify-center border border-white dark:border-canvas-dark">
                    {restockList.length}
                  </span>
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