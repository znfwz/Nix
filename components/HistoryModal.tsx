import React from 'react';
import { X, ArrowDown, ArrowUp, RefreshCcw, History } from 'lucide-react';
import { Item, UsageRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  // Format timestamp to readable string
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (type: UsageRecord['type'], delta: number) => {
    if (type === 'restock') return <ArrowUp size={16} className="text-green-500" />;
    if (type === 'consume' || delta < 0) return <ArrowDown size={16} className="text-gray-400" />;
    return <RefreshCcw size={16} className="text-blue-400" />;
  };

  const getLabel = (type: UsageRecord['type'], delta: number) => {
    if (type === 'restock') return '补货';
    if (type === 'consume') return '使用';
    return delta > 0 ? '增加' : '减少';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-2xl p-6 shadow-xl transform transition-transform pointer-events-auto animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-none">
          <div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
               <History size={20} className="text-secondary" />
               历史记录
             </h2>
             <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-2 px-2">
          {item.usageHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-600 space-y-2">
              <History size={48} strokeWidth={1.5} />
              <p>暂无记录</p>
            </div>
          ) : (
            <div className="relative border-l border-gray-200 dark:border-zinc-800 ml-4 my-2 space-y-6">
              {item.usageHistory.map((record, index) => (
                <div key={index} className="relative pl-6">
                   {/* Timeline Dot */}
                   <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                     record.type === 'restock' ? 'bg-green-500' : 
                     record.delta < 0 ? 'bg-gray-300 dark:bg-zinc-600' : 'bg-blue-400'
                   }`}></div>

                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono mb-0.5">
                          {formatDateTime(record.timestamp)}
                        </p>
                        <div className="flex items-center gap-2">
                           {getIcon(record.type, record.delta)}
                           <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                             {getLabel(record.type, record.delta)}
                           </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-lg font-mono font-bold ${
                          record.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {record.delta > 0 ? '+' : ''}{record.delta}
                        </span>
                        <div className="text-[10px] text-gray-400 dark:text-zinc-600">
                          {record.previousQuantity} → {record.newQuantity}
                        </div>
                      </div>
                   </div>
                </div>
              ))}
              
              {/* Creation Record (Virtual) */}
              <div className="relative pl-6">
                 <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary dark:bg-zinc-400 border-2 border-white dark:border-zinc-900"></div>
                 <div>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono mb-0.5">
                      {formatDateTime(item.createdAt)}
                    </p>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      创建物品
                    </span>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
