import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { Item } from '../types';
import { useInventory } from '../store';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Item | null;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({ isOpen, onClose, initialData }) => {
  const { addItem, updateItem, deleteItem } = useInventory();
  
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: '个',
    threshold: 1,
    expirationDate: '', // String format YYYY-MM-DD for input
  });

  useEffect(() => {
    if (initialData) {
      // Convert timestamp to YYYY-MM-DD for date input
      let dateStr = '';
      if (initialData.expirationDate) {
        const date = new Date(initialData.expirationDate);
        // Ensure we get YYYY-MM-DD format correctly
        dateStr = date.toISOString().split('T')[0];
      }

      setFormData({
        name: initialData.name,
        quantity: initialData.quantity,
        unit: initialData.unit,
        threshold: initialData.threshold,
        expirationDate: dateStr,
      });
    } else {
      setFormData({
        name: '',
        quantity: 1,
        unit: '个',
        threshold: 1,
        expirationDate: '',
      });
    }
  }, [initialData, isOpen]);

  // Reset delete confirm state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setIsDeleteConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert date string back to timestamp (noon to avoid timezone shifting issues on display)
    const expirationTimestamp = formData.expirationDate 
      ? new Date(formData.expirationDate).getTime() 
      : undefined;

    const submissionData = {
      name: formData.name,
      quantity: formData.quantity,
      unit: formData.unit,
      threshold: formData.threshold,
      expirationDate: expirationTimestamp,
    };

    if (initialData) {
      // Keep the original targetQuantity when editing
      updateItem(initialData.id, {
        ...submissionData,
        targetQuantity: initialData.targetQuantity
      });
    } else {
      // Set targetQuantity to the initial quantity when adding
      addItem({
        ...submissionData,
        targetQuantity: formData.quantity
      });
    }
    onClose();
  };

  const handleConfirmDelete = () => {
    if (initialData) {
      deleteItem(initialData.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-ink-main/20 dark:bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transform transition-transform pointer-events-auto animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-ink-main dark:text-ink-mainDark">
            {isDeleteConfirm ? '确认删除' : (initialData ? '编辑物品' : '新物品')}
          </h2>
          <button onClick={onClose} className="p-2 bg-canvas dark:bg-canvas-dark rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
            <X size={20} className="text-ink-sec dark:text-ink-secDark" />
          </button>
        </div>

        {isDeleteConfirm ? (
          /* Delete Confirmation View */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-ink-main dark:text-ink-mainDark mb-2">
                删除 "{formData.name}"?
              </h3>
              <p className="text-sm text-ink-sec dark:text-ink-secDark max-w-[80%]">
                删除后将无法恢复，历史消耗记录也将一并清除。
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteConfirm(false)}
                className="flex-1 py-4 rounded-xl bg-canvas dark:bg-canvas-dark text-ink-sec dark:text-ink-secDark font-bold text-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Trash2 size={20} />
                确认删除
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form View */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-sec dark:text-ink-secDark mb-1">物品名称</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-canvas dark:bg-canvas-dark border border-transparent focus:border-brand dark:focus:border-brand-dark rounded-xl focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand-dark/20 text-lg text-ink-main dark:text-ink-mainDark placeholder-ink-sec/40 outline-none transition-all"
                placeholder="例如：洗发水"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-sec dark:text-ink-secDark mb-1">当前数量</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setFormData(p => ({...p, quantity: Math.max(0, p.quantity - 1)}))} className="p-3 bg-canvas dark:bg-canvas-dark dark:text-ink-mainDark rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"><MinusIcon /></button>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-2 py-3 bg-canvas dark:bg-canvas-dark border-0 rounded-xl text-center text-lg font-mono text-ink-main dark:text-ink-mainDark outline-none"
                  />
                  <button type="button" onClick={() => setFormData(p => ({...p, quantity: p.quantity + 1}))} className="p-3 bg-canvas dark:bg-canvas-dark dark:text-ink-mainDark rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700"><PlusIcon /></button>
                </div>
              </div>
               <div>
                <label className="block text-sm font-medium text-ink-sec dark:text-ink-secDark mb-1">单位</label>
                 <input
                  type="text"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-4 py-3 bg-canvas dark:bg-canvas-dark border border-transparent focus:border-brand dark:focus:border-brand-dark rounded-xl focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand-dark/20 text-ink-main dark:text-ink-mainDark outline-none transition-all"
                  placeholder="个/包"
                />
              </div>
            </div>

            {/* Threshold and Expiration */}
            <div className="bg-canvas dark:bg-canvas-dark p-4 rounded-xl space-y-4">
               {/* Threshold */}
               <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-ink-main dark:text-ink-mainDark mb-0.5">预警阈值</label>
                    <p className="text-[10px] text-ink-sec dark:text-ink-secDark">库存低于此数量时提醒补货</p>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      value={formData.threshold}
                      onChange={e => setFormData({...formData, threshold: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-zinc-700 rounded-lg text-center font-mono text-ink-main dark:text-ink-mainDark outline-none focus:border-brand dark:focus:border-brand-dark"
                    />
                  </div>
               </div>
               
               {/* Divider */}
               <div className="h-px bg-gray-200 dark:bg-zinc-700"></div>

               {/* Expiration Date */}
               <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-ink-main dark:text-ink-mainDark mb-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-ink-sec" />
                        保质期
                        <span className="text-[10px] font-normal text-ink-sec bg-gray-200 dark:bg-zinc-700 px-1.5 rounded ml-1">选填</span>
                      </div>
                    </label>
                    <p className="text-[10px] text-ink-sec dark:text-ink-secDark">临期或过期时将会提醒</p>
                  </div>
                  <div className="w-36">
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                      className="w-full px-3 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-zinc-700 rounded-lg text-center text-sm font-medium text-ink-main dark:text-ink-mainDark min-h-[38px] outline-none focus:border-brand dark:focus:border-brand-dark"
                    />
                  </div>
               </div>
            </div>

            <div className="flex gap-3 pt-2">
              {initialData && (
                <button 
                  type="button" 
                  onClick={() => setIsDeleteConfirm(true)}
                  className="flex-none w-14 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button 
                type="submit" 
                className="flex-1 bg-brand dark:bg-brand-dark text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand/20 dark:shadow-brand-dark/20 hover:bg-brand-hover dark:hover:bg-brand-darkHover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Save size={20} />
                保存
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
)
