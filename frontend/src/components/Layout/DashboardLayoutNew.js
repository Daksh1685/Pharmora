'use client';

import { useState } from 'react';
import SidebarNew from './SidebarNew';
import TopbarNew from './TopbarNew';

const DashboardLayoutNew = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <SidebarNew isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopbarNew onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <main className="pt-28 sm:ml-64 transition-all duration-300 px-4 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-600 dark:border-slate-700 p-6 sm:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayoutNew;
