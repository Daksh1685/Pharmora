'use client';

import { useEffect } from 'react';
import useUIStore from '@/store/uiStore';

const NotificationCenter = () => {
  const notifications = useUIStore((state) => state.notifications) || [];
  const removeNotification = useUIStore((state) => state.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-[200] max-w-sm space-y-3 pointer-events-none">

      {/* Toast Notifications */}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg text-white pointer-events-auto transition-all ${
            {
              success: 'bg-emerald-500',
              error: 'bg-red-500',
              warning: 'bg-amber-500',
              info: 'bg-slate-50 dark:bg-slate-8000',
            }[notif.type] || 'bg-slate-700'
          }`}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <p className="flex-1 text-sm leading-relaxed">{notif.message}</p>
          <button
            onClick={() => removeNotification(notif.id)}
            className="text-white/80 hover:text-white flex-shrink-0 text-lg leading-none mt-[-2px]"
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
