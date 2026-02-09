import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { storageService } from '../utils';
import type { ThemeContextValue } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Create the context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { user } = useAuth();

  // Initialize theme from localStorage (instant, no network wait)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return storageService.getTheme();
  });

  // Apply theme to document root and save to localStorage when theme changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    storageService.saveTheme(theme);
  }, [theme]);

  // Sync theme from Supabase on login
  useEffect(() => {
    if (!user) return;

    const fetchTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching theme:', error);
          return;
        }

        if (data?.theme && (data.theme === 'light' || data.theme === 'dark')) {
          setTheme(data.theme);
        }
      } catch (error) {
        console.error('Error fetching theme from server:', error);
      }
    };

    fetchTheme();
  }, [user]);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';

      // Sync to Supabase in background (don't block UI)
      if (user) {
        supabase
          .from('user_settings')
          .upsert({ user_id: user.id, theme: newTheme }, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error('Error saving theme to server:', error);
          });
      }

      return newTheme;
    });
  };

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
