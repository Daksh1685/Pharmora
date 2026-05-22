'use client';

import ClientProviders from './providers';

export default function RootLayoutClient({ children }) {
  return <ClientProviders>{children}</ClientProviders>;
}

