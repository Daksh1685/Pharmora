import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document - only in browser
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }
        }
      },
      initTheme: () => {
        // Only run in browser environment
        if (typeof window === 'undefined') return;
        
        const saved = localStorage.getItem('theme') || 'light';
        set({ theme: saved });
        
        if (typeof document !== 'undefined') {
          if (saved === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

export default useThemeStore;
