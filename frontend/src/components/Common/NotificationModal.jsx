'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconAlertCircle, IconCheck, IconBell } from '@tabler/icons-react';

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title = 'Notification',
  message = '',
  actionLabel = 'OK',
  onAction
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950',
          border: 'border-emerald-200 dark:border-emerald-800',
          title: 'text-emerald-900 dark:text-emerald-100',
          icon: <IconCheck size={24} className="text-emerald-600 dark:text-emerald-400" />,
          button: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          title: 'text-red-900 dark:text-red-100',
          icon: <IconAlertCircle size={24} className="text-red-600 dark:text-red-400" />,
          button: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950',
          border: 'border-amber-200 dark:border-amber-800',
          title: 'text-amber-900 dark:text-amber-100',
          icon: <IconAlertCircle size={24} className="text-amber-600 dark:text-amber-400" />,
          button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800 dark:bg-blue-950',
          border: 'border-blue-200 dark:border-blue-800',
          title: 'text-blue-900 dark:text-blue-100',
          icon: <IconBell size={24} className="text-slate-700 dark:text-slate-300 dark:text-blue-400" />,
          button: 'bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 dark:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-800 dark:hover:bg-slate-500'
        };
    }
  };

  const styles = getTypeStyles();

  const handleClose = () => {
    onAction?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className={`${styles.bg} ${styles.border} border rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8`}
            >
              {/* Header with icon and close button */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {styles.icon}
                  </div>
                  <h3 className={`text-lg font-semibold ${styles.title}`}>
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 ml-2"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Message */}
              <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
                {message}
              </p>

              {/* Action Button */}
              <button
                onClick={handleClose}
                className={`w-full py-2.5 px-4 rounded-lg text-white font-semibold transition-colors ${styles.button}`}
              >
                {actionLabel}
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
