'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyThemeToDocument = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const darkModeEnabled = mode === 'dark';
  document.documentElement.classList.toggle('dark', darkModeEnabled);
  document.documentElement.style.colorScheme = darkModeEnabled ? 'dark' : 'light';
};

const getInitialTheme = (): ThemeMode => {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
  } catch (error) {
    // Ignore storage errors and fallback to system preference.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      // Ignore storage errors and still apply the selected theme.
    }
    applyThemeToDocument(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  useEffect(() => {
    const resolvedTheme = getInitialTheme();
    setThemeState(resolvedTheme);
    applyThemeToDocument(resolvedTheme);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      if (event.newValue !== 'dark' && event.newValue !== 'light') return;

      setThemeState(event.newValue);
      applyThemeToDocument(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const syncThemeFromDocument = () => {
      const detectedTheme: ThemeMode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setThemeState((previous) => (previous === detectedTheme ? previous : detectedTheme));
    };

    const observer = new MutationObserver(syncThemeFromDocument);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDarkMode: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
