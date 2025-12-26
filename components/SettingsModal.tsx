import React, { useRef, useState } from 'react';
import { X, Moon, Sun, Monitor, Download, Upload, Copy, FileText, Check, ChevronRight, Clipboard } from 'lucide-react';
import { useInventory } from '../store';
import { Theme, Item } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, items, importData } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for text import mode
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  
  // State for copy feedback
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen) return null;

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '浅色', icon: <Sun size={20} /> },
    { value: 'dark', label: '深色', icon: <Moon size={20} /> },
    { value: 'system', label: '跟随系统', icon: <Monitor size={20} /> },
  ];

  // --- Helper: Process Data (Auto-detect CSV or JSON) ---
  const processImportContent = (content: string) => {
    try {
      // 1. Try parsing as JSON first
      const jsonData = JSON.parse(content);
      if (Array.isArray(jsonData)) {
        importData(jsonData);
        return true;
      }
    } catch (e) {
      // Not JSON, fall through to CSV parser
    }

    try {
      // 2. Try parsing as CSV
      const rows = parseCSV(content);
      if (rows.length < 2) throw new Error('Invalid CSV');

      const headers = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);
      const newItems: Item[] = [];

      dataRows.forEach(row => {
        if (row.length < 2) return;
        const itemObj: any = {};
        headers.forEach((header, index) => {
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
        if (itemObj.id && itemObj.name) {
           newItems.push(itemObj as Item);
        }
      });

      if (newItems.length > 0) {
        importData(newItems);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    
    return false;
  };

  // --- CSV Export Logic ---
  const handleCSVExport = () => {
    const headers = [
      'id', 'name', 'quantity', 'unit', 'threshold', 'targetQuantity', 
      'expirationDate', 'createdAt', 'updatedAt', 'usageHistory'
    ];
    
    const rows = items.map(item => {
      return headers.map(header => {
        let value = item[header as keyof Item];
        if (value === undefined || value === null) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      }).join(',');
    });
    
    const csvString = [headers.join(','), ...rows].join('\n');
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

  // --- Clipboard Export Logic ---
  const handleCopyExport = async () => {
    const data = JSON.stringify(items, null, 2);
    try {
      await navigator.clipboard.writeText(data);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      alert('复制失败，请重试');
    }
  };

  // --- CSV Parser ---
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
                i++; 
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
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    return rows;
  };

  // --- File Import Handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (processImportContent(text)) {
        onClose();
      } else {
        alert('解析失败：文件格式不正确或内容为空');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Paste Import Handler ---
  const handlePasteImport = () => {
    if (!pasteContent.trim()) return;
    
    if (processImportContent(pasteContent)) {
      setPasteContent('');
      setIsPasteMode(false);
      onClose();
    } else {
      alert('无法识别数据格式，请确保复制了完整的 CSV 或 JSON 内容');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm mx-6 rounded-2xl p-6 shadow-2xl transform transition-all pointer-events-auto animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
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
            
            {/* 1. File Operations */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCSVExport}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                 <Download size={24} className="mb-2 text-blue-500 dark:text-blue-400" />
                 <span className="text-xs font-medium">导出文件 (CSV)</span>
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                 <Upload size={24} className="mb-2 text-blue-500 dark:text-blue-400" />
                 <span className="text-xs font-medium">导入文件 (CSV/TXT)</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv,.txt,.json" 
                className="hidden" 
              />
            </div>

            {/* 2. Clipboard/Text Operations (Mobile Friendly) */}
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={handleCopyExport}
                 className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-700 dark:text-gray-300 relative overflow-hidden"
               >
                  {copyFeedback ? (
                    <div className="absolute inset-0 bg-green-500 text-white flex flex-col items-center justify-center animate-in fade-in">
                       <Check size={24} className="mb-2" />
                       <span className="text-xs font-bold">已复制</span>
                    </div>
                  ) : (
                    <>
                      <Copy size={24} className="mb-2 text-primary dark:text-zinc-100" />
                      <span className="text-xs font-medium">复制数据 (文本)</span>
                    </>
                  )}
               </button>

               <button 
                 onClick={() => setIsPasteMode(!isPasteMode)}
                 className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors text-gray-700 dark:text-gray-300 ${isPasteMode ? 'bg-primary text-white dark:bg-zinc-100 dark:text-zinc-900 ring-2 ring-primary dark:ring-zinc-400' : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
               >
                  {isPasteMode ? (
                     <FileText size={24} className="mb-2" />
                  ) : (
                     <Clipboard size={24} className="mb-2 text-primary dark:text-zinc-100" />
                  )}
                  <span className="text-xs font-medium">粘贴导入 (文本)</span>
               </button>
            </div>

            {/* Paste Area (Collapsible) */}
            {isPasteMode && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="在此处粘贴导出的 JSON 或 CSV 文本内容..."
                  className="w-full h-32 p-3 text-xs bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-zinc-500 outline-none resize-none font-mono mb-2"
                />
                <button 
                  onClick={handlePasteImport}
                  disabled={!pasteContent.trim()}
                  className="w-full py-3 bg-primary dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                >
                  确认导入
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center leading-relaxed">
              支持 CSV 或 JSON 格式。导入将合并数据，相同 ID 的物品会被更新。<br/>
              文本模式适合手机间快速传输数据。
            </p>
        </div>

      </div>
    </div>
  );
};