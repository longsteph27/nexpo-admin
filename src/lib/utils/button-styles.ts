
import React from 'react';

/**
 * Button Style Logic for Preview Components
 * Ref: USER_REQUEST
 * 
 * COLOR RULE
 * primary: dùng màu từ theme hiện tại (var(--color-primary))
 * gray, black, white: dùng logic UI trung tính
 * 
 * VARIANT RENDER RULES
 * solid: background = color base, text = on background. Exception: white -> text=black, border=gray
 * outline: background = transparent, border = color base, text = color base. Exception: white -> border=gray, text=gray
 * soft: background = color soft, text = color base. Exception: black -> background = gray soft
 * ghost: background = transparent, text = color base, hover bg = color soft. Exception: white -> text=gray, hover bg=gray soft
 * link: background = none, border=none, text = color base. Exception: white -> text=gray
 * 
 * GLOBAL RULES
 * color là màu nền của button (trong variants cho phép có nền như solid/soft)
 * Không auto-contrast
 * Không suy đoán màu
 */

export interface ButtonStylesResult {
    className: string;
    style?: React.CSSProperties;
}

export function getButtonStyles(variant: string, color: string = 'primary'): ButtonStylesResult {
    const normVariant = (variant || 'solid') as 'solid' | 'outline' | 'soft' | 'ghost' | 'link';
    const normColor = color || 'primary';

    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

    // Check if it's one of our predefined keys
    const isKey = ['primary', 'gray', 'black', 'white'].includes(normColor);
    const isHex = normColor.startsWith('#');

    // Logic mapping for keys
    const keyColors: Record<string, { base: string; bg: string; border: string; soft: string; hoverSoft: string }> = {
        primary: {
            base: 'text-[var(--color-primary)]',
            bg: 'bg-[var(--color-primary)]',
            border: 'border-[var(--color-primary)]',
            soft: 'bg-[color-mix(in_srgb,var(--color-primary),transparent_90%)]',
            hoverSoft: 'hover:bg-[color-mix(in_srgb,var(--color-primary),transparent_90%)]'
        },
        gray: {
            base: 'text-[var(--color-gray)]',
            bg: 'bg-[var(--color-gray)]',
            border: 'border-[var(--color-gray)]',
            soft: 'bg-gray-100',
            hoverSoft: 'hover:bg-gray-100'
        },
        black: {
            base: 'text-black',
            bg: 'bg-black',
            border: 'border-black',
            soft: 'bg-gray-100', // Exception: black soft -> gray soft
            hoverSoft: 'hover:bg-gray-100'
        },
        white: {
            base: 'text-gray-500', // Default base for white text-related logic is gray
            bg: 'bg-white',
            border: 'border-gray-200',
            soft: 'bg-gray-50',
            hoverSoft: 'hover:bg-gray-50'
        }
    };

    // Helper to determine if we use custom style or predefined classes
    if (isKey) {
        const c = keyColors[normColor];

        switch (normVariant) {
            case 'solid':
                if (normColor === 'white') return { className: `${baseClasses} bg-white text-black border border-gray-200 hover:bg-gray-50` };
                return { className: `${baseClasses} ${c.bg} text-white border border-transparent hover:opacity-90` };

            case 'outline':
                if (normColor === 'white') return { className: `${baseClasses} bg-transparent border border-gray-200 text-gray-500 hover:bg-gray-50` };
                // outline: border = color base, text = color base
                return { className: `${baseClasses} bg-transparent ${c.border} ${c.base} hover:opacity-80` };

            case 'soft':
                if (normColor === 'black') return { className: `${baseClasses} bg-gray-100 text-black hover:bg-gray-200` };
                if (normColor === 'white') return { className: `${baseClasses} bg-gray-50 text-gray-600` };
                return { className: `${baseClasses} ${c.soft} ${c.base} hover:opacity-80` };

            case 'ghost':
                if (normColor === 'white') return { className: `${baseClasses} bg-transparent text-gray-500 hover:bg-gray-50` };
                return { className: `${baseClasses} bg-transparent ${c.base} ${c.hoverSoft}` };

            case 'link':
                if (normColor === 'white') return { className: `${baseClasses} bg-transparent p-0 h-auto text-gray-500 underline-offset-4 hover:underline` };
                return { className: `${baseClasses} bg-transparent p-0 h-auto ${c.base} underline-offset-4 hover:underline` };

            default:
                return { className: `${baseClasses} ${keyColors.primary.bg} text-white` };
        }
    }

    // Handle custom hex colors
    if (isHex) {
        const style: React.CSSProperties = {};
        let finalClasses = baseClasses;

        switch (normVariant) {
            case 'solid':
                style.backgroundColor = normColor;
                style.color = 'white'; // Default "on background" for custom solid
                finalClasses += " border border-transparent hover:opacity-90";
                break;

            case 'outline':
                style.borderColor = normColor;
                style.color = normColor;
                finalClasses += " bg-transparent border hover:opacity-80";
                break;

            case 'soft':
                // background = color soft (10% opacity)
                // color-mix is best but for style attribute we can use rgba or hex+alpha
                style.backgroundColor = `color-mix(in srgb, ${normColor}, transparent 90%)`;
                style.color = normColor;
                finalClasses += " hover:opacity-80";
                break;

            case 'ghost':
                style.color = normColor;
                // Hover bg is tricky for inline style, we use a utility class or just text
                finalClasses += ` bg-transparent hover:bg-gray-100`;
                break;

            case 'link':
                style.color = normColor;
                finalClasses += " bg-transparent p-0 h-auto underline-offset-4 hover:underline";
                break;

            default:
                style.backgroundColor = normColor;
                style.color = 'white';
        }

        return { className: finalClasses, style };
    }

    // Fallback to primary solid
    return { className: `${baseClasses} ${keyColors.primary.bg} text-white` };
}
