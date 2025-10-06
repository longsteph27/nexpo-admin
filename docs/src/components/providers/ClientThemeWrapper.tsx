'use client';

import React from 'react';
import { ThemeProvider } from './ThemeProvider';

interface ClientThemeWrapperProps {
  children: React.ReactNode;
  theme: any;
  globals: any;
  styleVars: Record<string, string>;
}

export function ClientThemeWrapper({ children, theme, globals, styleVars }: ClientThemeWrapperProps) {
  return (
    <div style={styleVars as React.CSSProperties}>
      <ThemeProvider theme={theme} globals={globals}>
        {children}
      </ThemeProvider>
    </div>
  );
} 