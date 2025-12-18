import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { Item } from '../types';
import { useInventory } from '../store';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Item | null;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({ isOpen, onClose, initialData }) => {
  const { addItem, updateItem, deleteItem } = useInventory();
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: '个',
    threshold: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        quantity: initialData.quantity,
        unit: initialData.unit,
        threshold: initialData.threshold,
      });
    } else {
      setFormData({
        name: '',
        quantity: 1,
        unit: '个',
        threshold: 1,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialData) {
      // Keep the original targetQuantity when editing
      updateItem(initialData.id, {
        ...formData,
        targetQuantity: initialData.targetQuantity
      });
    } else {
      // Set targetQuantity to the initial quantity when adding
      addItem({
        ...formData,
        targetQuantity: formData.quantity
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialData && confirm('确定要删除这个物品吗？')) {
      deleteItem(initialData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl transform transition-transform pointer-events-auto animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{initialData ? '编辑物品' : '新物品'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">物品名称</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-zinc-600 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-zinc-600"
              placeholder="例如：洗发水"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">当前数量</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setFormData(p => ({...p, quantity: Math.max(0, p.quantity - 1)}))} className="p-3 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl"><MinusIcon /></button>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-2 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl text-center text-lg font-mono text-gray-900 dark:text-gray-100"
                />
                <button type="button" onClick={() => setFormData(p => ({...p, quantity: p.quantity + 1}))} className="p-3 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl"><PlusIcon /></button>
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">单位</label>
               <input
                type="text"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-0 rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-zinc-600 text-gray-900 dark:text-gray-100"
                placeholder="个/包"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl">
             <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">预警阈值</label>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">库存低于此数量时提醒补货</p>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    value={formData.threshold}
                    onChange={e => setFormData({...formData, threshold: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-center font-mono text-gray-900 dark:text-gray-100"
                  />
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-2">
            {initialData && (
              <button 
                type="button" 
                onClick={handleDelete}
                className="flex-none w-14 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              type="submit" 
              className="flex-1 bg-primary dark:bg-zinc-100 text-white dark:text-zinc-900 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={20} />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)
