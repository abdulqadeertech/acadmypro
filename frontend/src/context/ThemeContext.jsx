import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('academypro_theme') || 'light');
  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('academypro_theme', theme);
    document.documentElement.classList.toggle('dark-theme', isDark);
    document.documentElement.style.colorScheme = theme;
  }, [theme, isDark]);

  const value = useMemo(() => ({
    theme,
    isDark,
    toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark'),
  }), [theme, isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
