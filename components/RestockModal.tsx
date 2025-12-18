import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Item } from '../types';
import { useInventory } from '../store';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose, item }) => {
  const { restockItem } = useInventory();
  const [quantity, setQuantity] = useState<number>(0);

  useEffect(() => {
    if (isOpen && item) {
      // Default to targetQuantity (initial quantity) as per requirements
      setQuantity(item.targetQuantity);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    restockItem(item.id, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm mx-6 rounded-2xl p-6 shadow-2xl transform transition-all pointer-events-auto animate-in zoom-in-95">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">确认补货</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{item.name}</p>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide">补货后库存</p>
            <div className="flex items-center justify-center gap-4">
               <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-zinc-700"
               >
                 -
               </button>
               <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-20 text-center bg-transparent text-3xl font-bold text-primary dark:text-zinc-100 border-none focus:ring-0 p-0"
               />
               <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-zinc-700"
               >
                 +
               </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
               当前: {item.quantity}{item.unit}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleConfirm}
            className="py-3 px-4 rounded-xl bg-primary dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
