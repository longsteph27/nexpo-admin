/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // NEXPO Brand Colors
                nexpo: {
                    // Primary Brand Colors
                    primary: {
                        50: '#EEF4FF',
                        100: '#E0ECFF', 
                        200: '#C7DBFF',
                        300: '#A5C4FF',
                        400: '#82A3FF',
                        500: '#4F80FF', // Main brand color
                        600: '#3B6BF6',
                        700: '#2C5CE2',
                        800: '#1E40AF',
                        900: '#1E3A8A',
                        950: '#0F1B3C',
                    },
                    
                    // Secondary Brand Colors
                    secondary: {
                        50: '#F8FAFC',
                        100: '#F1F5F9',
                        200: '#E2E8F0',
                        300: '#CBD5E1',
                        400: '#94A3B8',
                        500: '#64748B',
                        600: '#475569',
                        700: '#334155',
                        800: '#1E293B',
                        900: '#0F172A',
                        950: '#020617',
                    }
                },

                // Sidebar Colors
                sidebar: {
                    bg: '#06043E',        // Custom dark blue background
                    from: '#312E81',      // indigo-900
                    via: '#1E40AF',       // blue-900  
                    to: '#1E3A8A',        // blue-800
                    border: '#3B82F6',    // blue-500 with opacity
                    text: {
                        primary: '#FFFFFF',
                        secondary: '#DBEAFE', // blue-100
                        muted: '#BFDBFE',     // blue-200
                    }
                },

                // Status Colors
                status: {
                    draft: {
                        bg: '#F3F4F6',    // gray-100
                        text: '#1F2937',  // gray-800
                        border: '#D1D5DB', // gray-300
                    },
                    published: {
                        bg: '#DCFCE7',    // green-100
                        text: '#166534',  // green-800
                        border: '#BBF7D0', // green-200
                    },
                    archived: {
                        bg: '#FEE2E2',    // red-100
                        text: '#991B1B',  // red-800
                        border: '#FECACA', // red-200
                    },
                    live: {
                        bg: '#DCFCE7',    // green-100
                        text: '#166534',  // green-800
                        border: '#BBF7D0', // green-200
                    },
                    warning: {
                        bg: '#FEF3C7',    // yellow-100
                        text: '#92400E',  // yellow-800
                        border: '#FDE68A', // yellow-200
                    }
                },

                // UI Element Colors
                ui: {
                    // Backgrounds
                    bg: {
                        primary: '#FFFFFF',
                        secondary: '#F9FAFB',  // gray-50
                        tertiary: '#F3F4F6',   // gray-100
                        dark: '#1F2937',       // gray-800
                        overlay: 'rgba(0, 0, 0, 0.5)',
                    },
                    
                    // Text Colors
                    text: {
                        primary: '#111827',    // gray-900
                        secondary: '#6B7280',  // gray-500
                        muted: '#9CA3AF',      // gray-400
                        inverse: '#FFFFFF',
                        link: '#3B82F6',       // blue-500
                        linkHover: '#2563EB',  // blue-600
                    },

                    // Border Colors
                    border: {
                        light: '#E5E7EB',      // gray-200
                        medium: '#D1D5DB',     // gray-300
                        dark: '#6B7280',       // gray-500
                        focus: '#3B82F6',      // blue-500
                    },

                    // Interactive Colors
                    interactive: {
                        hover: '#F3F4F6',      // gray-100
                        active: '#E5E7EB',     // gray-200
                        focus: '#DBEAFE',      // blue-100
                        disabled: '#F9FAFB',   // gray-50
                    }
                },

                // Semantic Colors
                semantic: {
                    success: {
                        50: '#F0FDF4',
                        100: '#DCFCE7',
                        500: '#22C55E',
                        600: '#16A34A',
                        700: '#15803D',
                        800: '#166534',
                        900: '#14532D',
                    },
                    warning: {
                        50: '#FFFBEB',
                        100: '#FEF3C7',
                        500: '#F59E0B',
                        600: '#D97706',
                        700: '#B45309',
                        800: '#92400E',
                        900: '#78350F',
                    },
                    error: {
                        50: '#FEF2F2',
                        100: '#FEE2E2',
                        500: '#EF4444',
                        600: '#DC2626',
                        700: '#B91C1C',
                        800: '#991B1B',
                        900: '#7F1D1D',
                    },
                    info: {
                        50: '#EFF6FF',
                        100: '#DBEAFE',
                        500: '#3B82F6',
                        600: '#2563EB',
                        700: '#1D4ED8',
                        800: '#1E40AF',
                        900: '#1E3A8A',
                    }
                },

                // Legacy support
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            
            fontFamily: {
                sans: ["var(--font-geist-sans)", "Arial", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
            },

            // Custom gradients
            backgroundImage: {
                'nexpo-gradient': 'linear-gradient(135deg, #312E81 0%, #1E40AF 50%, #1E3A8A 100%)',
                'nexpo-gradient-hover': 'linear-gradient(135deg, #3730A3 0%, #2563EB 50%, #1D4ED8 100%)',
                'sidebar-gradient': 'linear-gradient(180deg, #312E81 0%, #1E40AF 50%, #1E3A8A 100%)',
            },

            // Box shadows
            boxShadow: {
                'nexpo': '0 4px 6px -1px rgba(79, 128, 255, 0.1), 0 2px 4px -1px rgba(79, 128, 255, 0.06)',
                'nexpo-lg': '0 10px 15px -3px rgba(79, 128, 255, 0.1), 0 4px 6px -2px rgba(79, 128, 255, 0.05)',
                'sidebar': '4px 0 6px -1px rgba(0, 0, 0, 0.1)',
            }
        },
    },
    plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("daisyui")
    ],
    daisyui: {
        themes: [
            {
                nexpo: {
                    primary: "#4F80FF",
                    "primary-content": "#FFFFFF",
                    secondary: "#64748B",
                    "secondary-content": "#FFFFFF", 
                    accent: "#22C55E",
                    "accent-content": "#FFFFFF",
                    neutral: "#1F2937",
                    "neutral-content": "#FFFFFF",
                    "base-100": "#FFFFFF",
                    "base-200": "#F9FAFB",
                    "base-300": "#E5E7EB",
                    "base-content": "#111827",
                    info: "#3B82F6",
                    "info-content": "#FFFFFF",
                    success: "#22C55E", 
                    "success-content": "#FFFFFF",
                    warning: "#F59E0B",
                    "warning-content": "#FFFFFF",
                    error: "#EF4444",
                    "error-content": "#FFFFFF",
                },
            },
            "dark",
            "cupcake",
        ],
        darkTheme: "dark",
        base: true,
        styled: true,
        utils: true,
        prefix: "",
        logs: true,
        themeRoot: ":root",
    },
}
