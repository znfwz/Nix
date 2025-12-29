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
      <div className="absolute inset-0 bg-ink-main/20 dark:bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-surface dark:bg-surface-dark w-full max-w-sm mx-6 rounded-2xl p-6 shadow-2xl transform transition-all pointer-events-auto animate-in zoom-in-95">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-ink-main dark:text-ink-mainDark mb-1">确认补货</h3>
          <p className="text-ink-sec dark:text-ink-secDark text-sm">{item.name}</p>
        </div>

        <div className="bg-canvas dark:bg-canvas-dark rounded-xl p-4 mb-6 text-center">
            <p className="text-xs text-ink-sec dark:text-ink-secDark font-medium mb-2 uppercase tracking-wide">补货后库存</p>
            <div className="flex items-center justify-center gap-4">
               <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-surface dark:bg-surface-dark border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-ink-sec dark:text-ink-secDark active:bg-gray-100 dark:active:bg-zinc-700"
               >
                 -
               </button>
               <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-20 text-center bg-transparent text-3xl font-bold text-brand dark:text-brand-dark border-none focus:ring-0 p-0 outline-none"
               />
               <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-full bg-surface dark:bg-surface-dark border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-ink-sec dark:text-ink-secDark active:bg-gray-100 dark:active:bg-zinc-700"
               >
                 +
               </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
               当前: {item.quantity}{item.unit}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-canvas dark:bg-canvas-dark text-ink-sec dark:text-ink-secDark font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleConfirm}
            className="py-3 px-4 rounded-xl bg-brand dark:bg-brand-dark text-white font-bold hover:bg-brand-hover dark:hover:bg-brand-darkHover transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={3} />
            确认
          </button>
        </div>
      </div>
    </div>
  );
};