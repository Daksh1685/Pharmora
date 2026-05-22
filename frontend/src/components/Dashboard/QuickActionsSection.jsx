'use client';

import { Card } from '@/components/Common';
import { IconPlus, IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';

const quickActions = [
  {
    id: 'add-medicine',
    label: 'Add Medicine',
    href: ROUTES.MEDICINES,
    icon: IconPlus,
    color: 'blue',
  },
  {
    id: 'view-sales',
    label: 'Record Sale',
    href: ROUTES.SALES,
    icon: IconArrowRight,
    color: 'emerald',
  },
  {
    id: 'manage-batches',
    label: 'Manage Batches',
    href: ROUTES.BATCHES,
    icon: IconArrowRight,
    color: 'amber',
  },
  {
    id: 'check-reports',
    label: 'View Reports',
    href: ROUTES.REPORTS,
    icon: IconArrowRight,
    color: 'purple',
  },
];

const colorClasses = {
  blue: { bg: 'from-blue-600 to-blue-700', hover: 'hover:from-blue-700 hover:to-blue-800', outline: 'border-blue-200 bg-slate-50 dark:bg-slate-800' },
  emerald: { bg: 'from-emerald-600 to-emerald-700', hover: 'hover:from-emerald-700 hover:to-emerald-800', outline: 'border-emerald-200 bg-emerald-50' },
  amber: { bg: 'from-amber-600 to-amber-700', hover: 'hover:from-amber-700 hover:to-amber-800', outline: 'border-amber-200 bg-amber-50' },
  purple: { bg: 'from-purple-600 to-purple-700', hover: 'hover:from-purple-700 hover:to-purple-800', outline: 'border-purple-200 bg-purple-50' },
};

export default function QuickActionsSection() {
  return (
    <Card className="p-4 sm:p-6 bg-white">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 sm:mb-6">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const { bg, hover } = colorClasses[action.color] || colorClasses.blue;
          return (
            <Link key={action.id} href={action.href} className="group">
              <button className={`w-full py-3 sm:py-4 px-2 sm:px-4 rounded-lg bg-gradient-to-br ${bg} text-white font-medium flex flex-col items-center justify-center gap-2 transition-colors duration-200 ${hover} shadow-sm hover:shadow-sm`}>
                <Icon size={18} className="sm:w-5 sm:h-5" strokeWidth={1.5} />
                <span className="text-xs sm:text-sm font-medium">{action.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
