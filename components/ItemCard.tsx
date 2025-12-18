import React, { useMemo, useState, useEffect } from 'react';
import { Minus, Plus, Clock, AlertCircle } from 'lucide-react';
import { Item } from '../types';
import { useInventory } from '../store';
import { calculateDaysRemaining, formatRelativeTime } from '../utils';

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit }) => {
  const { adjustQuantity } = useInventory();
  
  const daysRemaining = useMemo(() => calculateDaysRemaining(item), [item]);
  const isLowStock = item.quantity <= item.threshold;
  
  const lastActivity = item.usageHistory[0];

  // State for quantity update animation
  const [isBumped, setIsBumped] = useState(false);

  useEffect(() => {
    // Trigger animation when quantity changes
    setIsBumped(true);
    const timer = setTimeout(() => setIsBumped(false), 200);
    return () => clearTimeout(timer);
  }, [item.quantity]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]">
      {/* Low Stock Indicator Stripe */}
      {isLowStock && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent"></div>
      )}

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex-1 cursor-pointer" onClick={() => onEdit(item)}>
          <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight mb-1">{item.name}</h3>
          
          <div className="flex items-center gap-2 text-xs text-secondary dark:text-zinc-400">
            {daysRemaining !== null ? (
              <span className={`flex items-center gap-1 font-medium ${daysRemaining <= 3 ? 'text-accent' : 'text-blue-600 dark:text-blue-400'}`}>
                <Clock size={12} />
                预计可用 {daysRemaining} 天
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 dark:text-zinc-500">
                <Clock size={12} />
                计算中...
              </span>
            )}
            
            {lastActivity && lastActivity.type === 'consume' && (
               <span className="text-gray-400 dark:text-zinc-600 pl-2 border-l border-gray-200 dark:border-zinc-700">
                 {formatRelativeTime(lastActivity.timestamp)}用过
               </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
           <span className={`text-2xl font-mono font-bold tracking-tight transition-transform duration-200 origin-right ${isLowStock ? 'text-accent' : 'text-primary dark:text-zinc-100'} ${isBumped ? 'scale-125' : 'scale-100'}`}>
             {item.quantity}
             <span className="text-sm font-normal text-secondary dark:text-zinc-500 ml-1">{item.unit}</span>
           </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between gap-4 mt-2 pl-2">
        <div className="flex items-center gap-2">
             {isLowStock && (
               <div className="flex items-center gap-1 text-xs font-medium text-accent bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full animate-pulse">
                 <AlertCircle size={12} />
                 补货
               </div>
             )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); adjustQuantity(item.id, -1); }}
            className="w-12 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 active:bg-gray-300 dark:active:bg-zinc-600 active:scale-90 transition-all duration-200"
            aria-label="Decrease quantity"
          >
            <Minus size={20} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); adjustQuantity(item.id, 1); }}
            className="w-12 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 active:bg-gray-300 dark:active:bg-zinc-600 active:scale-90 transition-all duration-200"
             aria-label="Increase quantity"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
