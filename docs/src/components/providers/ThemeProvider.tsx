'use client';

import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  theme: any;
  globals: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ theme, globals, children }: { theme: any, globals: any, children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme, globals }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 