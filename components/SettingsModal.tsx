import React, { useRef } from 'react';
import { X, Moon, Sun, Monitor, Download, Upload, FileJson } from 'lucide-react';
import { useInventory } from '../store';
import { Theme, Item } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, items, importData } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '浅色', icon: <Sun size={20} /> },
    { value: 'dark', label: '深色', icon: <Moon size={20} /> },
    { value: 'system', label: '跟随系统', icon: <Monitor size={20} /> },
  ];

  // --- CSV Export Logic ---
  const handleExport = () => {
    const headers = [
      'id', 'name', 'quantity', 'unit', 'threshold', 'targetQuantity', 
      'expirationDate', 'createdAt', 'updatedAt', 'usageHistory'
    ];
    
    // Create CSV content
    const csvContent = items.map(item => {
      return headers.map(header => {
        let value = item[header as keyof Item];
        
        // Handle undefined/null
        if (value === undefined || value === null) {
          return '';
        }
        
        // Handle Object/Array (specifically usageHistory)
        if (typeof value === 'object') {
          // Serialize JSON and escape double quotes for CSV
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        // Handle String (escape quotes)
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',');
    });
    
    const csvString = [headers.join(','), ...csvContent].join('\n');
    
    // Create blob and download link
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `meila_inventory_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV Import Logic ---
  // Simple CSV parser supporting quotes
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++; // skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (currentCell || currentRow.length > 0) {
                 currentRow.push(currentCell);
                 rows.push(currentRow);
                 currentRow = [];
                 currentCell = '';
            }
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentCell += char;
        }
    }
    // Add last cell/row if exists
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        
        if (rows.length < 2) return; // Needs at least header and one row

        const headers = rows[0].map(h => h.trim());
        const dataRows = rows.slice(1);
        
        const newItems: Item[] = [];

        dataRows.forEach(row => {
          if (row.length < 2) return; // Skip empty rows
          
          const itemObj: any = {};
          
          headers.forEach((header, index) => {
             // Map standard headers
             const val = row[index];
             if (header === 'usageHistory') {
               try {
                 itemObj[header] = JSON.parse(val || '[]');
               } catch {
                 itemObj[header] = [];
               }
             } else {
               itemObj[header] = val;
             }
          });

          // Basic reconstruction validation
          if (itemObj.id && itemObj.name) {
             newItems.push(itemObj as Item);
          }
        });

        if (newItems.length > 0) {
          importData(newItems);
          onClose();
        } else {
          alert('未找到有效的物品数据');
        }

      } catch (err) {
        console.error(err);
        alert('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm mx-6 rounded-2xl p-6 shadow-2xl transform transition-all pointer-events-auto animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">设置</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4 mb-8">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">外观模式</p>
            <div className="space-y-2">
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

        {/* Data Management Section */}
        <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">数据管理</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                 <Download size={24} className="mb-2 text-primary dark:text-zinc-100" />
                 <span className="text-sm font-medium">导出 CSV</span>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                 <Upload size={24} className="mb-2 text-primary dark:text-zinc-100" />
                 <span className="text-sm font-medium">导入 CSV</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center">
              CSV 包含完整的使用历史记录。导入时将合并现有数据，相同 ID 的物品会被更新。
            </p>
        </div>

      </div>
    </div>
  );
};
