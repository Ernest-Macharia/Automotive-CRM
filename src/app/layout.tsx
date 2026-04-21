import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });
const themeInitializer = `
(() => {
  try {
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', shouldUseDark);
    document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light';
  } catch (error) {
    // Ignore theme initialization errors and fallback to default light mode.
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <ToastProvider>
          <ThemeProvider>
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
