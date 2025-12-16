import React, { memo } from 'react';
import { Icon } from '@iconify/react';
import { SubView } from './types';
import { useThemeState } from './ThemeContext';

interface AttributeSelectorProps {
    activeSubView: SubView;
    onSubViewClick: (view: SubView) => void;
}

const AttributeSelector = memo(({ activeSubView, onSubViewClick }: AttributeSelectorProps) => {
    const { selectedTheme } = useThemeState();

    return (
        <div className="space-y-4">
            {[
                { id: 'FONTS', label: 'Fonts', icon: 'lucide:type' },
                { id: 'COLORS', label: 'Colors', icon: 'lucide:palette' },
                { id: 'BUTTONS', label: 'Buttons', icon: 'lucide:mouse-pointer-2' },
            ].map((item) => (
                <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group ${activeSubView === item.id ? 'bg-gray-50' : ''}`}
                    onClick={() => onSubViewClick(activeSubView === item.id ? null : item.id as SubView)}
                >
                    <div className='flex items-center gap-4 overflow-hidden w-full'>
                        <div className='p-2 bg-gray-100 rounded-md text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all'>
                            <Icon icon={item.icon} className="w-5 h-5" />
                        </div>
                        <div className='flex-1 overflow-hidden min-w-0'>
                            <span className="text-sm font-semibold text-gray-900 block mb-0.5">{item.label}</span>

                            {/* Dynamic Preview Line - Only render if selectedTheme exists */}
                            {selectedTheme && (
                                <div className="h-5 flex items-center">
                                    {item.id === 'FONTS' && (
                                        <span className={`text-xs text-gray-500 truncate block ${selectedTheme.preview.fontFamily}`}>
                                            {selectedTheme.theme.fonts.families.display.split(',')[0]}
                                        </span>
                                    )}
                                    {item.id === 'COLORS' && (
                                        <div className="flex gap-1.5">
                                            {selectedTheme.preview.colorPalette.slice(0, 5).map((bg, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-3 h-3 rounded-full ring-1 ring-black/5 ${bg.startsWith('#') || bg.startsWith('rgb') ? '' : bg}`}
                                                    style={bg.startsWith('#') || bg.startsWith('rgb') ? { backgroundColor: bg } : undefined}
                                                ></div>
                                            ))}
                                        </div>
                                    )}
                                    {item.id === 'BUTTONS' && (
                                        <div className={`h-2 w-8 bg-gray-300 ${selectedTheme.preview.buttonStyle.borderRadius}`}></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <Icon icon="lucide:chevron-right" className="w-4 h-4 text-gray-400" />
                </div>
            ))}
        </div>
    );
});

AttributeSelector.displayName = 'AttributeSelector';

export default AttributeSelector;
