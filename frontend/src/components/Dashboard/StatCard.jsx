'use client';

import { Card } from '@/components/Common';

export default function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: { 
      bg: 'bg-slate-50 dark:bg-slate-800', 
      text: 'text-slate-700 dark:text-slate-300', 
      border: 'border-blue-100',
      icon: 'bg-slate-100 dark:bg-slate-700',
    },
    amber: { 
      bg: 'bg-amber-50', 
      text: 'text-amber-600', 
      border: 'border-amber-100',
      icon: 'bg-amber-100',
    },
    green: { 
      bg: 'bg-green-50', 
      text: 'text-green-600', 
      border: 'border-green-100',
      icon: 'bg-green-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      icon: 'bg-emerald-100',
    },
    red: { 
      bg: 'bg-red-50', 
      text: 'text-red-600', 
      border: 'border-red-100',
      icon: 'bg-red-100',
    },
    purple: { 
      bg: 'bg-purple-50', 
      text: 'text-purple-600', 
      border: 'border-purple-100',
      icon: 'bg-purple-100',
    },
  };

  const { bg, text, border, icon } = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={`p-4 sm:p-5 md:p-6 border ${border} dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm transition-all duration-200`}>
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-normal">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 sm:p-3 rounded-lg ${icon} flex-shrink-0`}>
            <Icon className={`${text}`} size={20} strokeWidth={1.5} />
          </div>
        )}
      </div>
      
      {/* Subtle bottom line */}
      <div className="mt-4 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
    </Card>
  );
}
