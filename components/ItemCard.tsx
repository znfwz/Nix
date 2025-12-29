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

  const getActivityText = () => {
    if (!lastActivity) return '无使用记录';
    const timeStr = formatRelativeTime(lastActivity.timestamp);
    switch (lastActivity.type) {
      case 'restock': return `${timeStr}补过货`;
      case 'consume': return `${timeStr}用过`;
      case 'adjust': return `${timeStr}有变动`;
      default: return `${timeStr}更新过`;
    }
  };

  return (
    <div 
      onClick={() => onViewHistory(item)}
      className="bg-surface dark:bg-surface-dark rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none border border-transparent dark:border-zinc-800/50 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer group"
    >
      {/* Low Stock Indicator Stripe - Using Warning Yellow */}
      {isLowStock && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-warning dark:bg-warning-dark"></div>
      )}

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-ink-main dark:text-ink-mainDark leading-tight">{item.name}</h3>
            
            {/* Dedicated Edit Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1.5 rounded-full text-ink-sec hover:text-brand hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
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
          
          <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-ink-sec dark:text-ink-secDark">
            {/* Usage Prediction */}
            {daysRemaining !== null ? (
              <span className={`flex items-center gap-1 font-medium ${daysRemaining <= 3 ? 'text-warning-text dark:text-warning-dark' : 'text-brand dark:text-brand-dark'}`}>
                <Clock size={12} />
                预计 {daysRemaining} 天
              </span>
            ) : (
              <span className="flex items-center gap-1 text-ink-sec/70">
                <Clock size={12} />
                计算中...
              </span>
            )}
            
            <span className="text-gray-200 dark:text-zinc-700">|</span>

            {/* Last Activity or Expiration Info */}
            {expirationStatus?.color === 'neutral' ? (
               <span className="flex items-center gap-1 text-ink-sec/70">
                 <Calendar size={12} />
                 {expirationStatus.label}到期
               </span>
            ) : (
               <span className="text-ink-sec/70">
                 {getActivityText()}
               </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
           {/* Quantity: Black in light mode, White in dark mode. Warning color if low stock. */}
           <span className={`text-2xl font-mono font-bold tracking-tight transition-transform duration-200 origin-right ${isLowStock ? 'text-warning-text dark:text-warning-dark' : 'text-ink-main dark:text-white'} ${isBumped ? 'scale-125' : 'scale-100'}`}>
             {item.quantity}
             <span className="text-sm font-normal text-ink-sec dark:text-ink-secDark ml-1">{item.unit}</span>
           </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between gap-4 mt-2 pl-2">
        <div className="flex items-center gap-2">
             {isLowStock && (
               <div className="flex items-center gap-1 text-xs font-bold text-warning-text bg-warning dark:bg-warning-dark dark:text-warning-darkText px-2 py-1 rounded-full animate-pulse">
                 <AlertCircle size={12} />
                 补货
               </div>
             )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); adjustQuantity(item.id, -1); }}
            className="w-12 h-10 flex items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark border border-transparent dark:border-zinc-700 text-ink-sec dark:text-ink-secDark hover:bg-gray-200 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-200"
            aria-label="Decrease quantity"
          >
            <Minus size={20} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); adjustQuantity(item.id, 1); }}
            className="w-12 h-10 flex items-center justify-center rounded-xl bg-canvas dark:bg-canvas-dark border border-transparent dark:border-zinc-700 text-brand dark:text-brand-dark hover:bg-brand/10 dark:hover:bg-brand-dark/10 active:scale-95 transition-all duration-200"
             aria-label="Increase quantity"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};