'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconDashboard,
  IconPill,
  IconLayoutGrid,
  IconShoppingCart,
  IconTruck,
  IconUsers,
  IconRobot,
  IconCreditCard,
  IconChartBar,
  IconSettings,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react';

const menuSections = [
  {
    title: 'MAIN MENU',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: IconDashboard },
      { label: 'Medicines', href: '/dashboard/medicines', icon: IconPill },
      { label: 'Categories', href: '/dashboard/categories', icon: IconLayoutGrid },
    ],
  },
  {
    title: 'LEADS',
    items: [
      { label: 'Orders', href: '/dashboard/orders', icon: IconShoppingCart },
      { label: 'Sales', href: '/dashboard/sales', icon: IconShoppingCart },
      { label: 'Customers', href: '/dashboard/customers', icon: IconUsers },
      { label: 'AI Chat', href: '/dashboard/ai', icon: IconRobot },
    ],
  },
  {
    title: 'COMMS',
    items: [
      { label: 'Payments', href: '/dashboard/payments', icon: IconCreditCard },
      { label: 'Reports', href: '/dashboard/reports', icon: IconChartBar },
      { label: 'Settings', href: '/dashboard/settings', icon: IconSettings },
    ],
  },
];

export default function SidebarNew({ isOpen, onClose }) {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isActive = (href) => {
    // Exact match for the route
    if (pathname === href) return true;
    // Match for sub-routes, but not if href is root /dashboard
    if (href !== '/dashboard' && pathname.startsWith(href + '/')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 sm:hidden z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-4 top-28 h-[calc(100vh-124px)] w-56 bg-gradient-to-b from-blue-50 via-slate-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-slate-300 dark:border-slate-600 dark:border-slate-700 shadow-xl z-40 transition-transform duration-300 rounded-2xl sm:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        {/* Navigation Sections - Scrollable */}
        <nav 
          className="flex-1 px-3 py-4 space-y-4 overflow-y-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        active
                          ? 'bg-slate-300 dark:bg-slate-300 text-slate-900 dark:text-slate-900 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-blue-200/30 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile Card */}
        <div className="px-3 py-3 border-t border-blue-200/40 dark:border-slate-700 bg-gradient-to-b from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900">
          <button
            onClick={onClose}
            className="sm:hidden absolute right-4 top-4 p-2 hover:bg-blue-200/40 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <IconX size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="bg-cyan-200/40 dark:bg-slate-700 rounded-lg p-3 shadow-sm border border-cyan-200/40 dark:border-slate-600">
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs mb-1">Complete Profile</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">Setup more features to unlock all features</p>
            <Link 
              href="/dashboard/settings"
              onClick={onClose}
              className="block w-full px-3 py-1.5 bg-slate-300 dark:bg-slate-300 text-slate-900 dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-400 dark:hover:bg-slate-400 transition-colors text-center"
            >
              Verify Identity
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
