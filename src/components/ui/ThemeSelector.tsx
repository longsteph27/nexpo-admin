'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Badge } from './badge';
import { globalApi } from '@/lib/api';
import { toast } from 'sonner';

interface ThemeTemplate {
  id: string;
  name: string;
  category: 'PROFESSIONAL' | 'PLAYFUL' | 'SOPHISTICATED';
  preview: {
    background: string;
    fontStyle: string;
    fontFamily: string;
    colorPalette: string[];
    buttonStyle: {
      background: string;
      textColor: string;
      border?: string;
      borderRadius: string;
    };
  };
  theme: {
    primary: string;
    secondary: string;
    borderRadius: string;
    fonts: {
      families: {
        display: string;
        body: string;
        code: string;
      };
    };
  };
}

const themeTemplates: ThemeTemplate[] = [
  // PROFESSIONAL
  {
    id: 'professional-minimal',
    name: 'Minimal Professional',
    category: 'PROFESSIONAL',
    preview: {
      background: 'bg-gray-50',
      fontStyle: 'font-bold text-black',
      fontFamily: 'font-sans',
      colorPalette: ['bg-white', 'bg-gray-100', 'bg-gray-300', 'bg-gray-600', 'bg-black'],
      buttonStyle: {
        background: 'bg-white',
        textColor: 'text-black',
        border: 'border border-black',
        borderRadius: 'rounded-none'
      }
    },
    theme: {
      primary: '#000000',
      secondary: '#6B7280',
      borderRadius: 'none',
      fonts: {
        families: {
          display: 'Inter, Arial, sans-serif',
          body: 'Inter, Arial, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },
  {
    id: 'professional-nature',
    name: 'Nature Professional',
    category: 'PROFESSIONAL',
    preview: {
      background: 'bg-stone-50',
      fontStyle: 'font-medium text-stone-800',
      fontFamily: 'font-serif',
      colorPalette: ['bg-white', 'bg-green-100', 'bg-green-600', 'bg-black', 'bg-green-400'],
      buttonStyle: {
        background: 'bg-green-600',
        textColor: 'text-white',
        borderRadius: 'rounded-none'
      }
    },
    theme: {
      primary: '#059669',
      secondary: '#374151',
      borderRadius: 'none',
      fonts: {
        families: {
          display: 'Georgia, serif',
          body: 'Georgia, serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },

  // PLAYFUL
  {
    id: 'playful-creative',
    name: 'Creative Playful',
    category: 'PLAYFUL',
    preview: {
      background: 'bg-purple-50',
      fontStyle: 'font-bold italic text-purple-800',
      fontFamily: 'font-sans',
      colorPalette: ['bg-pink-200', 'bg-purple-200', 'bg-purple-400', 'bg-purple-700', 'bg-purple-900'],
      buttonStyle: {
        background: 'bg-purple-900',
        textColor: 'text-pink-200',
        border: 'border border-pink-200',
        borderRadius: 'rounded-full'
      }
    },
    theme: {
      primary: '#581C87',
      secondary: '#FBB6CE',
      borderRadius: 'xl',
      fonts: {
        families: {
          display: 'Poppins, sans-serif',
          body: 'Poppins, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },
  {
    id: 'playful-bold',
    name: 'Bold Playful',
    category: 'PLAYFUL',
    preview: {
      background: 'bg-yellow-100',
      fontStyle: 'font-bold text-black',
      fontFamily: 'font-sans',
      colorPalette: ['bg-stone-100', 'bg-teal-300', 'bg-blue-500', 'bg-blue-700', 'bg-black'],
      buttonStyle: {
        background: 'bg-black',
        textColor: 'text-white',
        borderRadius: 'rounded-r-xl'
      }
    },
    theme: {
      primary: '#1E40AF',
      secondary: '#14B8A6',
      borderRadius: 'xl',
      fonts: {
        families: {
          display: 'Montserrat, sans-serif',
          body: 'Montserrat, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },

  // SOPHISTICATED
  {
    id: 'sophisticated-elegant',
    name: 'Elegant Sophisticated',
    category: 'SOPHISTICATED',
    preview: {
      background: 'bg-amber-50',
      fontStyle: 'font-medium text-amber-900',
      fontFamily: 'font-serif',
      colorPalette: ['bg-stone-50', 'bg-amber-200', 'bg-amber-600', 'bg-amber-800', 'bg-black'],
      buttonStyle: {
        background: 'bg-amber-800',
        textColor: 'text-white',
        borderRadius: 'rounded-none'
      }
    },
    theme: {
      primary: '#92400E',
      secondary: '#D97706',
      borderRadius: 'none',
      fonts: {
        families: {
          display: 'Playfair Display, serif',
          body: 'Source Sans Pro, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },
  {
    id: 'sophisticated-modern',
    name: 'Modern Sophisticated',
    category: 'SOPHISTICATED',
    preview: {
      background: 'bg-slate-50',
      fontStyle: 'font-semibold text-slate-800',
      fontFamily: 'font-sans',
      colorPalette: ['bg-white', 'bg-slate-200', 'bg-slate-400', 'bg-slate-600', 'bg-slate-900'],
      buttonStyle: {
        background: 'bg-slate-900',
        textColor: 'text-white',
        borderRadius: 'rounded-lg'
      }
    },
    theme: {
      primary: '#0F172A',
      secondary: '#64748B',
      borderRadius: 'lg',
      fonts: {
        families: {
          display: 'Inter, sans-serif',
          body: 'Inter, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },
  {
    id: 'sophisticated-luxury',
    name: 'Luxury Sophisticated',
    category: 'SOPHISTICATED',
    preview: {
      background: 'bg-rose-50',
      fontStyle: 'font-medium text-rose-900',
      fontFamily: 'font-serif',
      colorPalette: ['bg-white', 'bg-rose-200', 'bg-rose-400', 'bg-rose-700', 'bg-rose-900'],
      buttonStyle: {
        background: 'bg-rose-900',
        textColor: 'text-white',
        borderRadius: 'rounded-none'
      }
    },
    theme: {
      primary: '#9F1239',
      secondary: '#F43F5E',
      borderRadius: 'none',
      fonts: {
        families: {
          display: 'Crimson Text, serif',
          body: 'Source Sans Pro, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },

  // Additional themes
  {
    id: 'professional-tech',
    name: 'Tech Professional',
    category: 'PROFESSIONAL',
    preview: {
      background: 'bg-blue-50',
      fontStyle: 'font-semibold text-blue-900',
      fontFamily: 'font-mono',
      colorPalette: ['bg-white', 'bg-blue-100', 'bg-blue-400', 'bg-blue-700', 'bg-blue-900'],
      buttonStyle: {
        background: 'bg-blue-700',
        textColor: 'text-white',
        borderRadius: 'rounded-lg'
      }
    },
    theme: {
      primary: '#1D4ED8',
      secondary: '#3B82F6',
      borderRadius: 'lg',
      fonts: {
        families: {
          display: 'JetBrains Mono, monospace',
          body: 'Inter, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },
  {
    id: 'playful-sunset',
    name: 'Sunset Playful',
    category: 'PLAYFUL',
    preview: {
      background: 'bg-orange-50',
      fontStyle: 'font-bold text-orange-900',
      fontFamily: 'font-sans',
      colorPalette: ['bg-orange-100', 'bg-orange-300', 'bg-orange-500', 'bg-orange-700', 'bg-orange-900'],
      buttonStyle: {
        background: 'bg-orange-900',
        textColor: 'text-orange-100',
        borderRadius: 'rounded-full'
      }
    },
    theme: {
      primary: '#EA580C',
      secondary: '#FB923C',
      borderRadius: 'xl',
      fonts: {
        families: {
          display: 'Fredoka One, cursive',
          body: 'Nunito, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  },
  {
    id: 'sophisticated-forest',
    name: 'Forest Sophisticated',
    category: 'SOPHISTICATED',
    preview: {
      background: 'bg-emerald-50',
      fontStyle: 'font-medium text-emerald-900',
      fontFamily: 'font-serif',
      colorPalette: ['bg-white', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-700', 'bg-emerald-900'],
      buttonStyle: {
        background: 'bg-emerald-900',
        textColor: 'text-white',
        borderRadius: 'rounded-lg'
      }
    },
    theme: {
      primary: '#064E3B',
      secondary: '#10B981',
      borderRadius: 'lg',
      fonts: {
        families: {
          display: 'Merriweather, serif',
          body: 'Open Sans, sans-serif',
          code: 'JetBrains Mono, Consolas, monospace'
        }
      }
    }
  }
];

interface ThemeSelectorProps {
  onThemeSelect: (theme: ThemeTemplate['theme']) => void;
  currentTheme?: ThemeTemplate['theme'];
  siteId?: number;
}

export default function ThemeSelector({ onThemeSelect, currentTheme, siteId }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeTemplate | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentGlobalData, setCurrentGlobalData] = useState<any>(null);

  // Load current theme from global settings
  useEffect(() => {
    if (siteId && !currentTheme) {
      loadCurrentTheme();
    }
  }, [siteId]);

  // Match current theme with templates
  useEffect(() => {
    if (currentTheme) {
      const matchedTheme = themeTemplates.find(template =>
        template.theme.primary === currentTheme.primary &&
        template.theme.secondary === currentTheme.secondary &&
        template.theme.borderRadius === currentTheme.borderRadius
      );
      if (matchedTheme) {
        setSelectedTheme(matchedTheme);
      }
    }
  }, [currentTheme]);

  const loadCurrentTheme = async () => {
    if (!siteId) return;

    try {
      const response = await globalApi.getGlobal(siteId);
      if (response.success && response.data) {
        setCurrentGlobalData(response.data);
        // If theme exists in global data, use it
        if (response.data.theme && typeof response.data.theme === 'object') {
          const matchedTheme = themeTemplates.find(template =>
            template.theme.primary === response.data.theme.primary &&
            template.theme.secondary === response.data.theme.secondary &&
            template.theme.borderRadius === response.data.theme.borderRadius
          );
          if (matchedTheme) {
            setSelectedTheme(matchedTheme);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load current theme:', error);
    }
  };

  const handleThemeSelect = async (theme: ThemeTemplate) => {
    setSelectedTheme(theme);
    setIsUpdating(true);

    try {
      if (!siteId) {
        // Fallback to parent callback
        onThemeSelect(theme.theme);
        setIsOpen(false);
        return;
      }

      // Get current global settings
      const globalRes = await globalApi.getGlobal(siteId);
      if (!globalRes.success) {
        throw new Error(globalRes.error || 'Failed to get global settings');
      }

      if (globalRes.data && typeof globalRes.data === 'object' && 'id' in globalRes.data) {
        // Update existing global with new theme
        const updateRes = await globalApi.updateGlobal(String(globalRes.data.id), {
          theme: theme.theme
        });
        if (!updateRes.success) {
          throw new Error(updateRes.error || 'Failed to update theme');
        }
      } else {
        // Create new global with theme
        const createRes = await globalApi.createGlobal({
          site_id: siteId,
          theme: theme.theme
        });
        if (!createRes.success) {
          throw new Error(createRes.error || 'Failed to create theme');
        }
      }

      toast.success('Theme updated successfully!');

      // Update parent component
      onThemeSelect(theme.theme);

      // Refresh page to apply new theme
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Theme update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update theme');
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const groupedThemes = themeTemplates.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, ThemeTemplate[]>);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="z-50 bg-white/90 backdrop-blur-sm hover:bg-white"
          disabled={isUpdating}
        >
          <Icon
            icon={isUpdating ? "lucide:loader-2" : "lucide:palette"}
            className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`}
          />
          {isUpdating ? 'Updating...' : selectedTheme ? selectedTheme.name : 'Theme'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="lucide:palette" className="w-5 h-5" />
            Choose Your Theme
          </DialogTitle>
        </DialogHeader>

        {/* Current Theme Section */}
        {selectedTheme && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="lucide:check-circle" className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Current Theme</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`${selectedTheme.preview.background} p-2 rounded border`}>
                <span className={`${selectedTheme.preview.fontStyle} ${selectedTheme.preview.fontFamily} text-sm`}>
                  Aa
                </span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">{selectedTheme.name}</h4>
                <p className="text-xs text-blue-700">{selectedTheme.category}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedThemes).map(([category, themes]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm font-semibold">
                  {category}
                </Badge>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={selectedTheme?.id === theme.id}
                    onSelect={() => handleThemeSelect(theme)}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ThemeCardProps {
  theme: ThemeTemplate;
  isSelected: boolean;
  onSelect: () => void;
  isUpdating?: boolean;
}

function ThemeCard({ theme, isSelected, onSelect, isUpdating }: ThemeCardProps) {
  const { preview } = theme;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all ${isUpdating
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer hover:shadow-md'
        } ${isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      onClick={isUpdating ? undefined : onSelect}
    >
      {/* Theme Preview */}
      <div className={`${preview.background} p-4 rounded-lg mb-3`}>
        {/* Font Preview */}
        <div className="mb-3">
          <span className={`${preview.fontStyle} ${preview.fontFamily} text-lg`}>
            Aa
          </span>
        </div>

        {/* Color Palette */}
        <div className="flex gap-1 mb-3">
          {preview.colorPalette.map((color, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-sm ${color} border border-gray-200`}
            />
          ))}
        </div>

        {/* Button Preview */}
        <div className="flex justify-center">
          <div
            className={`px-4 py-2 text-sm font-medium ${preview.buttonStyle.background} ${preview.buttonStyle.textColor} ${preview.buttonStyle.borderRadius} ${preview.buttonStyle.border || ''}`}
          >
            Button
          </div>
        </div>
      </div>

      {/* Theme Name */}
      <h3 className="text-sm font-semibold text-gray-900 text-center">
        {theme.name}
      </h3>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Icon icon="lucide:check" className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
