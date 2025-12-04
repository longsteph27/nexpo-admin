/**
 * Hook to fetch and manage site theme
 * 
 * Fetches theme from globals collection and applies it to preview
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { globalApi } from '@/lib/api';
import {
  SiteTheme,
  DEFAULT_THEME,
  applyThemeToElement,
} from '../services/siteThemeService';

interface UseSiteThemeProps {
  siteId: number | undefined;
  enabled?: boolean;
  previewElementId?: string; // ID of element to apply theme to (for preview)
  applyToDocument?: boolean; // Whether to apply to document root
}

export function useSiteTheme({
  siteId,
  enabled = true,
  previewElementId,
  applyToDocument = false,
}: UseSiteThemeProps) {
  // Fetch global settings (contains theme)
  const { data: globalData, isLoading, error } = useQuery({
    queryKey: ['site-theme', siteId],
    queryFn: async () => {
      if (!siteId) return null;

      const result = await globalApi.getGlobal(Number(siteId));

      if (!result.success || !result.data) {
        return null;
      }

      return result.data as {
        id?: string;
        site_id?: number;
        theme?: SiteTheme;
        [key: string]: unknown;
      } | null;
    },
    enabled: enabled && !!siteId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract theme from global data
  const theme = useMemo(() => {
    if (!globalData) return DEFAULT_THEME;

    // Theme can be in different places depending on API response structure
    const themeData =
      (globalData as { theme?: SiteTheme }).theme ||
      (globalData as { translations?: Array<{ theme?: SiteTheme }> })?.translations?.[0]?.theme ||
      null;

    // Merge with default theme to ensure all properties exist
    return {
      ...DEFAULT_THEME,
      ...themeData,
    } as SiteTheme;
  }, [globalData]);

  // Apply theme to preview element or document
  useEffect(() => {
    if (!theme) return;

    if (applyToDocument && typeof document !== 'undefined') {
      // Apply to document root
      const vars = Object.entries({
        '--color-primary': theme.primary || DEFAULT_THEME.primary!,
        '--color-secondary': theme.secondary || DEFAULT_THEME.secondary!,
        '--border-radius': theme.borderRadius || DEFAULT_THEME.borderRadius!,
        '--font-display': theme.fonts?.families?.display || DEFAULT_THEME.fonts!.families!.display!,
        '--font-body': theme.fonts?.families?.body || DEFAULT_THEME.fonts!.families!.body!,
        '--font-code': theme.fonts?.families?.code || DEFAULT_THEME.fonts!.families!.code!,
      });

      vars.forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });

      return () => {
        // Cleanup: remove theme variables when component unmounts or theme changes
        vars.forEach(([key]) => {
          document.documentElement.style.removeProperty(key);
        });
      };
    } else if (previewElementId && typeof document !== 'undefined') {
      // Apply to specific element (for preview iframe or container)
      const element = document.getElementById(previewElementId);
      if (element) {
        applyThemeToElement(element, theme);
      }
    }
  }, [theme, previewElementId, applyToDocument]);

  return {
    theme,
    isLoading,
    error,
    globalData,
  };
}

