'use client';

import { useEffect, useState } from 'react';
import useUIStore from '@/store/uiStore';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';

const NotificationCenter = () => {
  const notifications = useUIStore((state) => state.notifications) || [];
  const removeNotification = useUIStore((state) => state.removeNotification);
  const [backendStatus, setBackendStatus] = useState('unknown'); // 'online' | 'offline' | 'unknown'

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(15000) });
        if (mounted) setBackendStatus(response.ok ? 'online' : 'offline');
      } catch {
        if (mounted) setBackendStatus('offline');
      }
    };

    // Grace period: wait 10s before first check so Render can warm up
    const initialDelay = setTimeout(checkBackend, 10000);
    const interval = setInterval(checkBackend, 60000);
    return () => {
      mounted = false;
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[200] max-w-sm space-y-3 pointer-events-none">
      {/* Backend Offline Banner */}
      {backendStatus === 'offline' && (
        <div className="flex items-center gap-3 p-4 rounded-xl shadow-xl bg-red-600 text-white pointer-events-auto border border-red-700">
          <IconWifiOff size={18} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">Server Warming Up</p>
            <p className="text-xs opacity-90 mt-0.5">Backend is starting, please wait a moment...</p>
          </div>
        </div>
      )}

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
