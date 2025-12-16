import React, { memo } from 'react';
import { Icon } from '@iconify/react';
import { ThemeTemplate } from './types';

interface ThemeCardProps {
    theme: ThemeTemplate;
    isSelected: boolean;
    onSelect: () => void;
    isUpdating?: boolean;
}

const ThemeCard = memo(({ theme, isSelected, onSelect, isUpdating }: ThemeCardProps) => {
    const { preview } = theme;

    return (
        <div
            className={`relative p-1 rounded-xl border-2 transition-all w-full overflow-hidden group ${isUpdating
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
                } ${isSelected
                    ? 'border-blue-600 ring-1 ring-blue-600'
                    : 'border-transparent hover:border-gray-200'
                }`}
            onClick={isUpdating ? undefined : onSelect}
        >
            {/* Theme Preview */}
            <div className={`${preview.background} p-4 rounded-lg flex items-center justify-between gap-4 overflow-hidden h-20`}>

                <span className={`${preview.fontStyle} ${preview.fontFamily} text-3xl flex-shrink-0 text-gray-900`}>Aa</span>

                <div className="flex -space-x-1.5 flex-shrink-0">
                    {preview.colorPalette.slice(0, 4).map((bg, i) => (
                        <div
                            key={i}
                            className={`w-5 h-5 rounded-full ring-1 ring-white ${bg.startsWith('#') || bg.startsWith('rgb') ? '' : bg}`}
                            style={bg.startsWith('#') || bg.startsWith('rgb') ? { backgroundColor: bg } : undefined}
                        ></div>
                    ))}
                </div>

                <div
                    className={`px-2 py-1 text-[10px] font-bold truncate max-w-[60px] ${preview.buttonStyle.textColor} ${preview.buttonStyle.borderRadius} ${preview.buttonStyle.background.startsWith('#') || preview.buttonStyle.background.startsWith('rgb') ? '' : preview.buttonStyle.background}`}
                    style={preview.buttonStyle.background.startsWith('#') || preview.buttonStyle.background.startsWith('rgb') ? { backgroundColor: preview.buttonStyle.background } : undefined}
                >
                    Button
                </div>
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5">
                    <Icon icon="lucide:check" className="w-3 h-3" />
                </div>
            )}

            <div className="mt-2 px-1 flex items-center justify-between">
                <h3 className="text-xs font-medium text-gray-700 truncate pr-2 group-hover:text-gray-900">
                    {theme.name}
                </h3>
            </div>
        </div>
    );
});

ThemeCard.displayName = 'ThemeCard';

export default ThemeCard;
