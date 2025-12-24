import React, { useMemo, useState, useEffect } from 'react';
import { Minus, Plus, Clock, AlertCircle, Calendar, Pencil } from 'lucide-react';
import { Item } from '../types';
import { useInventory } from '../store';
import { calculateDaysRemaining, formatRelativeTime } from '../utils';

interface ItemCardProps {
  item: Item;
  onEdit: (item: Item) => void;
  onViewHistory: (item: Item) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onViewHistory }) => {
  const { adjustQuantity } = useInventory();
  
  const daysRemaining = useMemo(() => calculateDaysRemaining(item), [item]);
  const isLowStock = item.quantity <= item.threshold;
  
  const lastActivity = item.usageHistory[0];

  // Expiration logic
  const expirationStatus = useMemo(() => {
    if (!item.expirationDate) return null;
    
    const now = new Date();
    // Normalize today to start of day to compare dates properly
    now.setHours(0, 0, 0, 0);
    
    const expDate = new Date(item.expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: '已过期', color: 'red', days: Math.abs(diffDays) };
    }
    if (diffDays <= 30) {
      return { label: `${diffDays}天后过期`, color: 'orange', days: diffDays };
    }
    return { label: expDate.toLocaleDateString('zh-CN'), color: 'neutral', days: diffDays };
  }, [item.expirationDate]);

  // State for quantity update animation
  const [isBumped, setIsBumped] = useState(false);

  useEffect(() => {
    // Trigger animation when quantity changes
    setIsBumped(true);
    const timer = setTimeout(() => setIsBumped(false), 200);
    return () => clearTimeout(timer);
  }, [item.quantity]);

  return (
    <div 
      onClick={() => onViewHistory(item)}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer group"
    >
      {/* Low Stock Indicator Stripe */}
      {isLowStock && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent"></div>
      )}

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight">{item.name}</h3>
            
            {/* Dedicated Edit Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1.5 rounded-full text-gray-300 hover:text-primary hover:bg-gray-100 dark:text-zinc-600 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              <Pencil size={14} />
            </button>

            {/* Expiration Badge */}
            {expirationStatus && expirationStatus.color !== 'neutral' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                expirationStatus.color === 'red' 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {expirationStatus.label}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-secondary dark:text-zinc-400">
            {/* Usage Prediction */}
            {daysRemaining !== null ? (
              <span className={`flex items-center gap-1 font-medium ${daysRemaining <= 3 ? 'text-accent' : 'text-blue-600 dark:text-blue-400'}`}>
                <Clock size={12} />
                预计 {daysRemaining} 天
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 dark:text-zinc-500">
                <Clock size={12} />
                计算中...
              </span>
            )}
            
            <span className="text-gray-300 dark:text-zinc-700">|</span>

            {/* Last Activity or Expiration Info */}
            {expirationStatus?.color === 'neutral' ? (
               <span className="flex items-center gap-1 text-gray-400 dark:text-zinc-500">
                 <Calendar size={12} />
                 {expirationStatus.label}到期
               </span>
            ) : lastActivity && lastActivity.type === 'consume' ? (
               <span className="text-gray-400 dark:text-zinc-600">
                 {formatRelativeTime(lastActivity.timestamp)}用过
               </span>
            ) : (
               <span className="text-gray-400 dark:text-zinc-600">无使用记录</span>
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
