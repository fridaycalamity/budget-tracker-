import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { storageService } from '../utils';
import type { ThemeContextValue } from '../types';

// Create the context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component
 * Manages theme state and persistence
 * Applies theme class to document root
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme from localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return storageService.getTheme();
  });

  // Apply theme to document root and save to localStorage when theme changes
  useEffect(() => {
    // Remove both classes first
    document.documentElement.classList.remove('light', 'dark');
    // Add the current theme class
    document.documentElement.classList.add(theme);
    // Save to localStorage
    storageService.saveTheme(theme);
  }, [theme]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Custom hook to use the theme context
 * Throws error if used outside ThemeProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
