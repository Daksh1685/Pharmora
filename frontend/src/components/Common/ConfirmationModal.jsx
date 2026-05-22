'use client';

import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '@/store/uiStore';
import { IconAlertTriangle, IconInfoCircle, IconAlertCircle, IconX } from '@tabler/icons-react';

const ConfirmationModal = () => {
  const { confirmModal, closeConfirm } = useUIStore();
  const { isOpen, title, message, onConfirm, confirmText, cancelText, type } = confirmModal;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeConfirm();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger': return <IconAlertTriangle className="text-red-500" size={24} />;
      case 'warning': return <IconAlertCircle className="text-orange-500" size={24} />;
      case 'info': return <IconInfoCircle className="text-slate-700 dark:text-slate-400" size={24} />;
      default: return <IconInfoCircle className="text-slate-700 dark:text-slate-400" size={24} />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-200';
      case 'warning': return 'bg-orange-600 hover:bg-orange-700 shadow-orange-200';
      case 'info': return 'bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 shadow-blue-200';
      default: return 'bg-slate-800 hover:bg-slate-900 shadow-slate-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeConfirm}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 pt-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  type === 'danger' ? 'bg-red-50 dark:bg-red-900/20' : 
                  type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' : 
                  'bg-slate-50 dark:bg-slate-800 dark:bg-blue-900/20'
                }`}>
                  {getIcon()}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              </div>
              <button
                onClick={closeConfirm}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 flex items-center gap-3">
              {cancelText && (
                <button
                  onClick={closeConfirm}
                  className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-[0.98] border border-slate-200 dark:border-slate-700"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`${cancelText ? 'flex-1' : 'w-full'} px-4 py-3 text-sm font-bold text-white rounded-2xl transition-all active:scale-[0.98] shadow-lg ${getButtonClass()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
