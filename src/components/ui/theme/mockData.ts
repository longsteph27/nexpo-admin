import { ThemeTemplate } from './types';

export const mockFonts = [
    { id: 'font-inter', name: 'Inter', family: 'Inter, sans-serif', style: 'font-sans' },
    { id: 'font-serif', name: 'Merriweather', family: 'Merriweather, serif', style: 'font-serif' },
    { id: 'font-mono', name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', style: 'font-mono' },
    { id: 'font-poppins', name: 'Poppins', family: 'Poppins, sans-serif', style: 'font-sans' },
    { id: 'font-playfair', name: 'Playfair Display', family: 'Playfair Display, serif', style: 'font-serif' },
];

export const mockColors = [
    { id: 'color-blue', name: 'Ocean Blue', primary: '#1D4ED8', secondary: '#3B82F6', palette: ['bg-blue-50', 'bg-blue-200', 'bg-blue-500', 'bg-blue-700', 'bg-blue-900'] },
    { id: 'color-green', name: 'Forest Green', primary: '#059669', secondary: '#10B981', palette: ['bg-green-50', 'bg-green-200', 'bg-green-500', 'bg-green-700', 'bg-green-900'] },
    { id: 'color-purple', name: 'Royal Purple', primary: '#581C87', secondary: '#A855F7', palette: ['bg-purple-50', 'bg-purple-200', 'bg-purple-500', 'bg-purple-700', 'bg-purple-900'] },
    { id: 'color-orange', name: 'Sunset Orange', primary: '#EA580C', secondary: '#F97316', palette: ['bg-orange-50', 'bg-orange-200', 'bg-orange-500', 'bg-orange-700', 'bg-orange-900'] },
    { id: 'color-slate', name: 'Modern Slate', primary: '#0F172A', secondary: '#64748B', palette: ['bg-slate-50', 'bg-slate-200', 'bg-slate-500', 'bg-slate-700', 'bg-slate-900'] },
];

export const mockButtonStyles = [
    { id: 'btn-rounded', name: 'Rounded', borderRadius: 'rounded-lg', previewClass: 'rounded-lg' },
    { id: 'btn-pill', name: 'Pill', borderRadius: 'rounded-full', previewClass: 'rounded-full' },
    { id: 'btn-square', name: 'Square', borderRadius: 'rounded-none', previewClass: 'rounded-none' },
    { id: 'btn-soft', name: 'Softer', borderRadius: 'rounded-md', previewClass: 'rounded-md' },
];

export const themeTemplates: ThemeTemplate[] = [
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
