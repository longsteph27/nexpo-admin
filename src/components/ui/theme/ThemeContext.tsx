import React, { createContext, useContext, useReducer, useMemo, ReactNode, useCallback } from 'react';
import { ThemeTemplate } from './types';

// --- State Types ---
interface ThemeState {
    selectedTheme: ThemeTemplate | null;
    // We can add other UI state here if needed (e.g. activeSubView could be here or local)
}

// --- Action Types ---
type ThemeAction =
    | { type: 'SET_THEME'; payload: ThemeTemplate }
    | { type: 'UPDATE_THEME'; payload: { preview: Partial<ThemeTemplate['preview']>; theme: Partial<ThemeTemplate['theme']> } }
    | { type: 'RESET_THEME' }; // If needed

// --- Contexts ---
const ThemeStateContext = createContext<ThemeState | null>(null);
const ThemeDispatchContext = createContext<React.Dispatch<ThemeAction> | null>(null);

// --- Reducer ---
function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
    switch (action.type) {
        case 'SET_THEME':
            return { ...state, selectedTheme: action.payload };
        case 'UPDATE_THEME': {
            if (!state.selectedTheme) return state;

            const { preview: updatedPreview, theme: updatedTheme } = action.payload;

            // Deep merge logic matching previous implementation
            const newThemeData = { ...state.selectedTheme.theme };
            if (updatedTheme.fonts) {
                newThemeData.fonts = {
                    ...state.selectedTheme.theme.fonts,
                    ...updatedTheme.fonts,
                    families: {
                        ...state.selectedTheme.theme.fonts.families,
                        ...updatedTheme.fonts.families
                    }
                };
            }
            if (updatedTheme.primary) newThemeData.primary = updatedTheme.primary;
            if (updatedTheme.secondary) newThemeData.secondary = updatedTheme.secondary;
            if (updatedTheme.borderRadius) newThemeData.borderRadius = updatedTheme.borderRadius;

            const newPreviewData = { ...state.selectedTheme.preview };
            if (updatedPreview.buttonStyle) {
                newPreviewData.buttonStyle = {
                    ...state.selectedTheme.preview.buttonStyle,
                    ...updatedPreview.buttonStyle
                };
            }
            if (updatedPreview.background) newPreviewData.background = updatedPreview.background;
            if (updatedPreview.fontStyle) newPreviewData.fontStyle = updatedPreview.fontStyle;
            if (updatedPreview.fontFamily) newPreviewData.fontFamily = updatedPreview.fontFamily;
            if (updatedPreview.colorPalette) newPreviewData.colorPalette = updatedPreview.colorPalette;

            return {
                ...state,
                selectedTheme: {
                    ...state.selectedTheme,
                    id: 'custom-draft',
                    name: 'Custom Theme',
                    preview: newPreviewData,
                    theme: newThemeData
                }
            };
        }
        default:
            return state;
    }
}

// --- Provider ---
interface ThemeProviderProps {
    children: ReactNode;
    initialTheme?: ThemeTemplate | null;
}

export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => {
    const [state, dispatch] = useReducer(themeReducer, { selectedTheme: initialTheme || null });

    // Stable dispatch
    const dispatchValue = useMemo(() => dispatch, []);

    return (
        <ThemeDispatchContext.Provider value={dispatchValue}>
            <ThemeStateContext.Provider value={state}>
                {children}
            </ThemeStateContext.Provider>
        </ThemeDispatchContext.Provider>
    );
};

// --- Hooks ---
export const useThemeState = () => {
    const context = useContext(ThemeStateContext);
    if (!context) {
        throw new Error('useThemeState must be used within a ThemeProvider');
    }
    return context;
};

export const useThemeDispatch = () => {
    const context = useContext(ThemeDispatchContext);
    if (!context) {
        throw new Error('useThemeDispatch must be used within a ThemeProvider');
    }
    return context;
};
