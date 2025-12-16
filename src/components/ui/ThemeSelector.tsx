'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from './button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Import extracted components and data
import ThemePreviewSection from './theme/ThemePreviewSection';
import AttributeSelector from './theme/AttributeSelector';
import ThemeCard from './theme/ThemeCard';
import { ThemeTemplate, SubView } from './theme/types';
import { themeTemplates, mockFonts, mockColors, mockButtonStyles } from './theme/mockData';
import { ThemeProvider, useThemeState, useThemeDispatch } from './theme/ThemeContext';

interface ThemeSelectorProps {
  onPreview: (theme: ThemeTemplate['theme'] | null) => void;
  onSave: (theme: ThemeTemplate['theme']) => Promise<void>;
  onClose: () => void;
  currentTheme?: ThemeTemplate['theme'];
}

// Inner Component that consumes Context
const ThemeSelectorContent = ({ onPreview, onSave, onClose }: Omit<ThemeSelectorProps, 'currentTheme'>) => {
  const { selectedTheme } = useThemeState();
  const dispatch = useThemeDispatch();
  const [activeSubView, setActiveSubView] = useState<SubView>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with parent preview whenever selectedTheme changes in context
  useEffect(() => {
    if (selectedTheme) {
      onPreview(selectedTheme.theme);
    }
  }, [selectedTheme, onPreview]);

  // Handler Wrappers
  const handleUpdate = useCallback((updatedPreview: Partial<ThemeTemplate['preview']>, updatedTheme: Partial<ThemeTemplate['theme']>) => {
    dispatch({ type: 'UPDATE_THEME', payload: { preview: updatedPreview, theme: updatedTheme } });
  }, [dispatch]);

  const handleThemePresetSelect = useCallback((theme: ThemeTemplate) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, [dispatch]);

  const handleSave = async () => {
    if (!selectedTheme) return;

    setIsSaving(true);
    try {
      await onSave(selectedTheme.theme);
      toast.success('Theme saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onPreview(null);
    onClose();
  };

  const groupedThemes = useMemo(() => themeTemplates.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, ThemeTemplate[]>), []);

  const SubPanel = () => {
    // Note: Can split this further if SubLists get complex, but keeping here for now
    if (!activeSubView) return null;

    // ... SubPanel Logic mostly same, but using handleUpdate/handleThemePresetSelect from hooks
    let title = '';
    let content = null;

    switch (activeSubView) {
      case 'THEMES':
        title = 'Browse Themes';
        content = (
          <div className="space-y-8">
            {Object.entries(groupedThemes).map(([category, themes]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {category}
                  </span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {themes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      onSelect={() => handleThemePresetSelect(theme)}
                      isUpdating={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
        break;
      case 'FONTS':
        title = 'Select Fonts';
        content = (
          <div className="space-y-2">
            {mockFonts.map((font) => (
              <div
                key={font.id}
                onClick={() => handleUpdate(
                  {
                    fontFamily: font.style,
                    fontStyle: font.id === 'font-serif' ? 'font-medium' : 'font-sans'
                  },
                  {
                    fonts: {
                      families: {
                        display: font.family,
                        body: font.family,
                        code: selectedTheme?.theme.fonts.families.code || 'monospace'
                      }
                    }
                  }
                )}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all flex items-center justify-between ${selectedTheme?.theme.fonts.families.body === font.family ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <div className="flex flex-col">
                  <span className={`text-2xl mb-1 ${font.style}`}>Ag</span>
                  <span className="text-sm font-medium text-gray-900">{font.name}</span>
                </div>
                {selectedTheme?.theme.fonts.families.body === font.family && <Icon icon="lucide:check" className="text-blue-500" />}
              </div>
            ))}
          </div>
        );
        break;
      case 'COLORS':
        title = 'Select Colors';
        content = (
          <div className="space-y-2">
            {mockColors.map((color) => (
              <div
                key={color.id}
                onClick={() => handleUpdate(
                  { colorPalette: color.palette },
                  { primary: color.primary, secondary: color.secondary }
                )}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all flex items-center justify-between ${selectedTheme?.theme.primary === color.primary ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <div className='flex items-center gap-4'>
                  <div className='flex'>
                    {color.palette.slice(0, 4).map((bg, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${bg} -ml-2 first:ml-0`}></div>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{color.name}</span>
                </div>
                {selectedTheme?.theme.primary === color.primary && <Icon icon="lucide:check" className="text-blue-500" />}
              </div>
            ))}
          </div>
        );
        break;
      case 'BUTTONS':
        title = 'Button Styles';
        content = (
          <div className="grid grid-cols-2 gap-3">
            {mockButtonStyles.map((btn) => (
              <div
                key={btn.id}
                onClick={() => handleUpdate(
                  { buttonStyle: { ...selectedTheme!.preview.buttonStyle, borderRadius: btn.borderRadius } },
                  { borderRadius: btn.borderRadius === 'rounded-full' ? 'xl' : btn.borderRadius === 'rounded-none' ? 'none' : 'lg' }
                )}
                className={`p-6 rounded-lg cursor-pointer border-2 transition-all flex flex-col items-center justify-center gap-4 ${selectedTheme?.preview.buttonStyle.borderRadius === btn.borderRadius ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <div className={`px-6 py-2.5 bg-black text-white text-sm font-bold shadow-sm ${btn.borderRadius}`}>
                  Button
                </div>
                <span className="text-xs font-medium text-gray-500">{btn.name}</span>
              </div>
            ))}
          </div>
        );
        break;
      default:
        content = <div className="p-4">Content for {activeSubView}</div>;
    }

    return (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 20, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="h-[calc(100vh)] w-[320px] bg-white border-l border-gray-200 shadow-xl overflow-hidden flex flex-col absolute right-[320px] top-0 z-10"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveSubView(null)} className="p-1 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
              <Icon icon="lucide:chevron-left" className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={() => setActiveSubView(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Icon icon="lucide:x" className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-white">{content}</div>
      </motion.div>
    )
  }

  // --- Main Layout ---
  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      className="fixed inset-y-0 right-0 flex flex-row-reverse pointer-events-auto h-full z-50 shadow-2xl"
    >
      {/* Sidebar Container */}
      <div className="h-full w-[320px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-xl">
        <div className="py-6 px-2 space-y-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Site Styles</h2>
            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors lg:hidden">
              <Icon icon="lucide:x" className="w-5 h-5" />
            </button>
          </div>

          <ThemePreviewSection />

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="space-y-2">
            <div
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group ${activeSubView === 'THEMES' ? 'bg-gray-50' : ''}`}
              onClick={() => setActiveSubView(activeSubView === 'THEMES' ? null : 'THEMES')}
            >
              <div className='flex items-center gap-4'>
                <div className='p-2 bg-gray-100 rounded-md text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all'>
                  <Icon icon="lucide:layout-template" className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Browse Themes</span>
                <div className="bg-blue-600/10 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">NEW</div>
              </div>
              <Icon icon="lucide:chevron-right" className="w-4 h-4 text-gray-400 ml-2" />
            </div>

            <AttributeSelector activeSubView={activeSubView} onSubViewClick={setActiveSubView} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3 bg-white">
          <Button variant="ghost" className="flex-1" onClick={handleClose} disabled={isSaving}>Cancel</Button>
          <Button className="flex-1 bg-black text-white hover:bg-black/90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {activeSubView && <SubPanel />}
      </AnimatePresence>
    </motion.div>
  );
};


// Main Export - Wrapper
export default function ThemeSelector(props: ThemeSelectorProps) {
  // Logic to determine initialTheme
  const initialTheme = useMemo(() => {
    if (!props.currentTheme) return null;
    const matched = themeTemplates.find(template =>
      template.theme.primary === props.currentTheme!.primary &&
      template.theme.secondary === props.currentTheme!.secondary &&
      template.theme.borderRadius === props.currentTheme!.borderRadius &&
      template.theme.fonts.families.body === props.currentTheme!.fonts.families.body &&
      template.theme.fonts.families.display === props.currentTheme!.fonts.families.display
    );
    if (matched) return matched;
    return {
      id: 'custom-loaded',
      name: 'Custom Theme',
      category: 'PROFESSIONAL',
      preview: {
        background: 'bg-gray-50',
        fontStyle: 'font-sans',
        fontFamily: props.currentTheme.fonts.families.body.includes('serif') ? 'font-serif' : 'font-sans',
        colorPalette: [props.currentTheme.primary, props.currentTheme.secondary, 'bg-gray-200'],
        buttonStyle: {
          background: props.currentTheme.primary,
          textColor: '#fff',
          borderRadius: props.currentTheme.borderRadius === 'full' ? 'rounded-full' : props.currentTheme.borderRadius === 'none' ? 'rounded-none' : 'rounded-lg'
        }
      },
      theme: props.currentTheme
    } as ThemeTemplate;
  }, [props.currentTheme]);

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ThemeSelectorContent {...props} />
    </ThemeProvider>
  );
}
