export interface ThemeTemplate {
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

export type SubView = 'THEMES' | 'FONTS' | 'COLORS' | 'BUTTONS' | null;
