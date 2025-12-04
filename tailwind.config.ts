/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/features/**/*.{js,ts,jsx,tsx,mdx}',
        './docs/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Accent color (DaisyUI compatible)
                accent: 'hsl(240 4.8% 95.9%)',
                
                // Content Text Colors
                content: {
                    primary: '#1A1A1A',     // Primary text - đen đậm
                    secondary: '#404040',   // Secondary text - xám đậm
                    tertiary: '#666666',    // Tertiary text - xám vừa
                },
                border: {
                    tertiary: '#D9D9D9',
                },
                bg: {
                    hover: '#F7F7F7',
                },
                'content-preview': "#f9fafb",
                
                // CSS Variables from globals.css
                background: "var(--background)",
                foreground: "var(--foreground)",
                'background-secondary': "#F7F7F7",
                
                // Content Text Colors from CSS Variables
                'content-primary': "var(--content-primary)",
                'content-secondary': "var(--content-secondary)", 
                'content-tertiary': "var(--content-tertiary)",
                
                // VNPT Colors from CSS Variables
                'vnpt-blue': "var(--vnpt-blue)",
                'vnpt-light-blue': "var(--vnpt-light-blue)",
                'vnpt-gray': "var(--vnpt-gray)",
                'vnpt-light-gray': "var(--vnpt-light-gray)",
                
                // Hero Block Colors from CSS Variables
                primary: "var(--color-content-primary)",
                secondary: "var(--color-content-secondary)",
                tertiary: "var(--color-content-tertiary)",
                gray: "var(--color-gray)",
                'bg-gray-upload': "var(--bg-gray-upload)",
                
                // Sidebar Colors from CSS Variables
                sidebar: "var(--sidebar)",
                'sidebar-foreground': "var(--sidebar-foreground)",
                'sidebar-primary': "var(--sidebar-primary)",
                'sidebar-primary-foreground': "var(--sidebar-primary-foreground)",
                'sidebar-accent': "var(--sidebar-accent)",
                'sidebar-accent-foreground': "var(--sidebar-accent-foreground)",
                'sidebar-border': "var(--sidebar-border)",
                'sidebar-ring': "var(--sidebar-ring)",
                
                // NEXPO Colors from CSS Variables
                'nexpo-blue': "var(--color-nexpo-blue)",
                'nexpo-gray': "var(--color-nexpo-gray)",
                'nexpo-light-gray': "var(--color-nexpo-light-gray)",
                'nexpo-bg-gray': "var(--color-nexpo-bg-gray)",
                'nexpo-bg-sidebar': "var(--color-nexpo-bg-sidebar)",
                
                // Additional CSS Variables from globals.css
                'color-primary': "var(--color-primary)",
                'color-gray': "var(--color-gray)",
                'color-nexpo-blue': "var(--color-nexpo-blue)",
                'color-nexpo-gray': "var(--color-nexpo-gray)",
                'color-nexpo-light-gray': "var(--color-nexpo-light-gray)",
                'color-nexpo-bg-gray': "var(--color-nexpo-bg-gray)",
                'color-nexpo-bg-sidebar': "var(--color-nexpo-bg-sidebar)",
                'color-sidebar': "var(--color-sidebar)",
                'color-sidebar-foreground': "var(--color-sidebar-foreground)",
                'color-sidebar-primary': "var(--color-sidebar-primary)",
                'color-sidebar-primary-foreground': "var(--color-sidebar-primary-foreground)",
                'color-sidebar-accent': "var(--color-sidebar-accent)",
                'color-sidebar-accent-foreground': "var(--color-sidebar-accent-foreground)",
                'color-sidebar-border': "var(--color-sidebar-border)",
                'color-sidebar-ring': "var(--color-sidebar-ring)",
                
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
                    },
                    'blue': '#0075F4',
                    'gray': '#374151',
                    'light-gray': '#D9D9D9',
                    'border-secondary': '#A6A6A6',
                    'bg-gray': '#F7F7F7',
                    'bg-sidebar': '#06043E'
                },

                // Sidebar Colors
                // sidebar: {
                //     bg: '#06043E',        // Custom dark blue background
                //     from: '#312E81',      // indigo-900
                //     via: '#1E40AF',       // blue-900  
                //     to: '#1E3A8A',        // blue-800
                //     border: '#3B82F6',    // blue-500 with opacity
                //     text: {
                //         primary: '#FFFFFF',
                //         secondary: '#DBEAFE', // blue-100
                //         muted: '#BFDBFE',     // blue-200
                //     }
                // },

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
                }
            },
            
            fontFamily: {
                sans: ["var(--font-geist-sans)", "Arial", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
                sf: [
                    'SF Pro Display',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'system-ui',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif'
                ],
                'sf-text': [
                    'SF Pro Text',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'system-ui',
                    'sans-serif'
                ],
                // Font families from globals.css
                'font-poppins': ['Poppins', 'system-ui', 'sans-serif'],
                'font-body': ['var(--font-body, Inter, sans-serif)'],
                'font-display': ['var(--font-display, Poppins, serif)'],
                'font-code': ['var(--font-code, Fira Code, monospace)'],
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
            },
            
            // Animation support for globals.css
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out',
            },
            
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            
            // Additional CSS Variables from globals.css (merged into existing colors above)
        },
    },
    plugins: [
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("daisyui"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("@tailwindcss/typography")
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
                    "error-content": "#FFFFFF"
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
