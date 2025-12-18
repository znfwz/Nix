import React from 'react';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { useInventory } from '../store';
import { Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useInventory();

  if (!isOpen) return null;

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '浅色', icon: <Sun size={20} /> },
    { value: 'dark', label: '深色', icon: <Moon size={20} /> },
    { value: 'system', label: '跟随系统', icon: <Monitor size={20} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm mx-6 rounded-2xl p-6 shadow-2xl transform transition-all pointer-events-auto animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">设置</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">外观模式</p>
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        theme === option.value 
                        ? 'bg-primary text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md' 
                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-750'
                    }`}
                >
                    <div className="flex items-center gap-3 font-medium">
                        {option.icon}
                        {option.label}
                    </div>
                    {theme === option.value && <div className="w-2 h-2 rounded-full bg-accent"></div>}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
