"use client";

import { useEffect } from 'react';

type FontVars = {
  '--font-display': string;
  '--font-body': string;
  '--font-code': string;
};

export function FontVariablesSetter({ fontVars }: { fontVars: FontVars }) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      Object.entries(fontVars).forEach(([key, value]) => {
        document.body.style.setProperty(key, value);
      });
    }
    // Clean up on unmount
    return () => {
      if (typeof document !== 'undefined') {
        Object.keys(fontVars).forEach((key) => {
          document.body.style.removeProperty(key);
        });
      }
    };
  }, [fontVars]);
  return null;
} 