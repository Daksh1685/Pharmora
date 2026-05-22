'use client';

import { useEffect, useState } from 'react';
import useThemeStore from '@/store/themeStore';
import NotificationCenter from '@/components/Common/NotificationCenter';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import { useAuthInit } from '@/hooks/useAuthInit';

export default function ClientProviders({ children }) {
  const initTheme = useThemeStore((state) => state.initTheme);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Initialize auth state
  useAuthInit();
  
  // Real Client ID from Google Cloud Console
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);
    
    // Initialize theme on app load - runs after hydration
    initTheme();
  }, [initTheme]);

  // Prevent rendering until after hydration to avoid mismatches
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {!isHydrated ? (
        <>{children}</>
      ) : (
        <>
          {children}
          <NotificationCenter />
          <ConfirmationModal />
        </>
      )}
    </GoogleOAuthProvider>
  );
}
