import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useThemeState } from './ThemeContext';

const ThemePreviewSection = memo(() => {
    const { selectedTheme } = useThemeState();

    if (!selectedTheme) return null;

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Themes</h3>

            {/* Grey Container */}
            <div className="bg-gray-200/80 rounded-lg p-2">
                {/* Theme Preview Card */}
                <motion.div
                    layout
                    className={`rounded-xl p-6 h-full flex items-center justify-center gap-3 shadow-sm border border-white/20 relative overflow-hidden transition-colors duration-500 ${selectedTheme.preview.background}`}
                >
                    {/* Font Preview */}
                    <motion.div layout className="flex items-end">
                        <motion.span
                            key={`font-${selectedTheme.preview.fontFamily}`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-5xl leading-none ${selectedTheme.preview.fontStyle} ${selectedTheme.preview.fontFamily}`}
                        >
                            Aa
                        </motion.span>
                    </motion.div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-black/10"></div>

                    {/* Color Palette */}
                    <div className="flex -space-x-5">
                        {selectedTheme.preview.colorPalette.slice(0, 5).map((color, i) => (
                            <motion.div
                                layout
                                key={i}
                                className={`w-8 h-12 rounded-md shadow-sm ring-1 ring-white/50 first:rounded-l-lg last:rounded-r-lg z-[${5 - i}] ${color.startsWith('#') || color.startsWith('rgb') ? '' : color}`}
                                style={color.startsWith('#') || color.startsWith('rgb') ? { backgroundColor: color } : undefined}
                            />
                        ))}
                    </div>

                    {/* Button Preview */}
                    <motion.div
                        layout
                        className={`px-4 py-1.5 text-xs font-bold text-white shadow-sm ${selectedTheme.preview.buttonStyle.textColor} ${selectedTheme.preview.buttonStyle.borderRadius} ${selectedTheme.preview.buttonStyle.background.startsWith('#') || selectedTheme.preview.buttonStyle.background.startsWith('rgb') ? '' : selectedTheme.preview.buttonStyle.background}`}
                        style={selectedTheme.preview.buttonStyle.background.startsWith('#') || selectedTheme.preview.buttonStyle.background.startsWith('rgb') ? { backgroundColor: selectedTheme.preview.buttonStyle.background } : undefined}
                    >
                        Button
                    </motion.div>

                </motion.div>
            </div>

            <div className='flex items-center justify-between px-1'>
                <span className='font-medium text-gray-900 text-sm'>{selectedTheme.name}</span>
            </div>
        </div>
    );
});

ThemePreviewSection.displayName = 'ThemePreviewSection';

export default ThemePreviewSection;
