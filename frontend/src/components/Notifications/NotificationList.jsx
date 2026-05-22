'use client';

import { IconAlertTriangle, IconCalendar, IconPackage, IconTrash } from '@tabler/icons-react';

export default function NotificationList({
  notifications = [],
  onMarkAsRead,
  onClearAll,
}) {
  const getIcon = (type) => {
    switch (type) {
      case 'out_of_stock':
        return <IconAlertTriangle size={18} className="text-red-500" />;
      case 'low_stock':
        return <IconPackage size={18} className="text-amber-500" />;
      case 'expiry':
        return <IconCalendar size={18} className="text-orange-500" />;
      case 'expired':
        return <IconAlertTriangle size={18} className="text-red-500" />;
      default:
        return <IconAlertTriangle size={18} className="text-slate-500" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'out_of_stock':
        return 'bg-red-50 border-red-200';
      case 'low_stock':
        return 'bg-amber-50 border-amber-200';
      case 'expiry':
        return 'bg-orange-50 border-orange-200';
      case 'expired':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-900">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-slate-500 text-sm">No notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${getColor(
                notif.type
              )}`}
              onClick={() => onMarkAsRead(notif.id)}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {notif.title}
                      </p>
                      <p className="text-slate-600 text-sm mt-1 break-words">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="flex-shrink-0 w-2 h-2 bg-slate-50 dark:bg-slate-8000 rounded-full mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {formatTime(notif.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
