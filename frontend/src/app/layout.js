import './globals.css';
import RootLayoutClient from './client-layout';

export const metadata = {
  title: 'Pharmora Inventory Management',
  description: 'Cloud-based Pharmora Inventory Management System',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 font-sans antialiased dark:bg-slate-950 transition-colors">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
