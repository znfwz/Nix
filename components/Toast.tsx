import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ToastProps {
  message: string;
  onUndo: () => void;
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, onUndo, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-zinc-800 text-white px-4 py-3 rounded-xl shadow-lg shadow-gray-200/20 dark:shadow-none animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-[90vw] sm:max-w-md">
      <span className="text-sm font-medium truncate min-w-0">{message}</span>
      <div className="w-px h-4 bg-gray-700 flex-shrink-0"></div>
      <button 
        onClick={onUndo}
        className="text-sm font-bold text-accent hover:text-rose-400 active:text-rose-300 flex items-center gap-1.5 transition-colors flex-shrink-0 whitespace-nowrap"
      >
        <RotateCcw size={14} />
        撤销
      </button>
    </div>
  );
};