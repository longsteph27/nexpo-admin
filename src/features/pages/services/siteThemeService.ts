/**
 * Site Theme Service
 * 
 * Service để quản lý theme/color của site và apply CSS variables
 * Theme được lưu trong globals collection của Directus
 */

export interface SiteTheme {
  primary?: string;
  secondary?: string;
  orange?: string;
  borderRadius?: string;
  fonts?: {
    families?: {
      display?: string;
      body?: string;
      code?: string;
    };
  };
  [key: string]: unknown; // Allow other theme properties
}

export const DEFAULT_THEME: SiteTheme = {
  primary: '#1E40AF',
  secondary: '#64748B',
  orange: 'slate',
  borderRadius: 'xl',
  fonts: {
    families: {
      display: 'Roboto, Arial, sans-serif',
      body: 'Poppins, Open Sans, sans-serif',
      code: 'Source Code Pro, Consolas, monospace',
    },
  },
};

/**
 * Convert theme object to CSS variables
 */
export function themeToCSSVariables(theme: SiteTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Primary color
  if (theme.primary) {
    vars['--color-primary'] = theme.primary;
    vars['--theme-primary'] = theme.primary;
    // Headline color uses primary color
    vars['--color-headline'] = theme.primary;
    vars['--theme-headline'] = theme.primary;
  }

  // Secondary color
  if (theme.secondary) {
    vars['--color-secondary'] = theme.secondary;
    vars['--theme-secondary'] = theme.secondary;
  }

  // Border radius
  if (theme.borderRadius) {
    vars['--border-radius'] = theme.borderRadius;
    vars['--theme-border-radius'] = theme.borderRadius;
  }

  // Font families
  if (theme.fonts?.families) {
    if (theme.fonts.families.display) {
      vars['--font-display'] = theme.fonts.families.display;
      vars['--theme-font-display'] = theme.fonts.families.display;
    }
    if (theme.fonts.families.body) {
      vars['--font-body'] = theme.fonts.families.body;
      vars['--theme-font-body'] = theme.fonts.families.body;
    }
    if (theme.fonts.families.code) {
      vars['--font-code'] = theme.fonts.families.code;
      vars['--theme-font-code'] = theme.fonts.families.code;
    }
  }

  return vars;
}

/**
 * Apply theme CSS variables to an element
 */
export function applyThemeToElement(
  element: HTMLElement | null,
  theme: SiteTheme
): void {
  if (!element) return;

  const vars = themeToCSSVariables(theme);
  Object.entries(vars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Apply theme CSS variables to document root
 */
export function applyThemeToDocument(theme: SiteTheme): void {
  if (typeof document === 'undefined') return;

  const vars = themeToCSSVariables(theme);
  const root = document.documentElement;
  
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Remove theme CSS variables from document root
 */
export function removeThemeFromDocument(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const themeVarKeys = [
    '--color-primary',
    '--color-secondary',
    '--color-headline',
    '--border-radius',
    '--font-display',
    '--font-body',
    '--font-code',
    '--theme-primary',
    '--theme-secondary',
    '--theme-headline',
    '--theme-border-radius',
    '--theme-font-display',
    '--theme-font-body',
    '--theme-font-code',
  ];

  themeVarKeys.forEach((key) => {
    root.style.removeProperty(key);
  });
}

