'use client';

import { IconAlertCircle, IconCheck, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';

const Alert = ({ type = 'info', message, onClose }) => {
  const config = {
    success: {
      icon: IconCheck,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
    },
    error: {
      icon: IconAlertCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
    },
    warning: {
      icon: IconAlertTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
    },
    info: {
      icon: IconInfoCircle,
      bg: 'bg-slate-50 dark:bg-slate-800',
      border: 'border-blue-200',
      text: 'text-blue-800',
    },
  };

  const settings = config[type];
  const Icon = settings.icon;

  return (
    <div className={`${settings.bg} border ${settings.border} ${settings.text} px-4 py-3 rounded-lg flex items-start gap-3`}>
      <Icon size={20} className="mt-0.5 flex-shrink-0" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 text-lg">
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
