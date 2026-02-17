import { useEffect, type ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const applyTheme = () => {
      const tg = window.Telegram?.WebApp;
      const colorScheme = tg?.colorScheme ?? 'light';
      document.documentElement.setAttribute('data-theme-mode', colorScheme);
    };

    applyTheme();
  }, []);

  return <>{children}</>;
}
