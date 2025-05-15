import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createSelector } from './selectors';

// Tipo de tema
export type ThemeMode = 'light' | 'dark' | 'system';

// Tipo de vista de cartas
export type CardViewMode = 'grid' | 'list' | 'compact';

// Tipo de dirección de ordenamiento
export type SortDirection = 'asc' | 'desc';

// Interfaz para las preferencias del usuario
interface UserPreferencesState {
    // Temas y UI
    theme: ThemeMode;
    fontSize: number; // Tamaño de fuente base (en px)
    animationsEnabled: boolean;
    reduceMotion: boolean;
    highContrastMode: boolean;

    // Preferencias para cartas
    cardViewMode: CardViewMode;
    cardsPerPage: number;
    defaultCardSort: string;
    defaultSortDirection: SortDirection;
    showCardDetails: boolean;

    // Notificaciones
    notificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;

    // Idioma
    language: string;

    // Comportamiento
    autoSaveDeck: boolean;
    confirmBeforeDelete: boolean;
    showTips: boolean;

    // Acciones
    setTheme: (theme: ThemeMode) => void;
    setFontSize: (size: number) => void;
    toggleAnimations: () => void;
    toggleReduceMotion: () => void;
    toggleHighContrastMode: () => void;
    setCardViewMode: (mode: CardViewMode) => void;
    setCardsPerPage: (count: number) => void;
    setDefaultCardSort: (sort: string) => void;
    setDefaultSortDirection: (direction: SortDirection) => void;
    toggleShowCardDetails: () => void;
    toggleNotifications: () => void;
    toggleEmailNotifications: () => void;
    setLanguage: (lang: string) => void;
    toggleAutoSaveDeck: () => void;
    toggleConfirmBeforeDelete: () => void;
    toggleShowTips: () => void;
    resetToDefaults: () => void;
}

// Preferencias por defecto
const defaultPreferences = {
    theme: 'system' as ThemeMode,
    fontSize: 16,
    animationsEnabled: true,
    reduceMotion: false,
    highContrastMode: false,
    cardViewMode: 'grid' as CardViewMode,
    cardsPerPage: 24,
    defaultCardSort: 'name',
    defaultSortDirection: 'asc' as SortDirection,
    showCardDetails: true,
    notificationsEnabled: true,
    emailNotificationsEnabled: false,
    language: 'es',
    autoSaveDeck: true,
    confirmBeforeDelete: true,
    showTips: true
};

// Store base para preferencias de usuario
const useUserPreferencesStoreBase = create<UserPreferencesState>()(
    persist(
        (set) => ({
            ...defaultPreferences,

            // Acciones para tema y UI
            setTheme: (theme) => set({ theme }),

            setFontSize: (fontSize) => set({ fontSize }),

            toggleAnimations: () => set((state) => ({
                animationsEnabled: !state.animationsEnabled
            })),

            toggleReduceMotion: () => set((state) => ({
                reduceMotion: !state.reduceMotion
            })),

            toggleHighContrastMode: () => set((state) => ({
                highContrastMode: !state.highContrastMode
            })),

            // Acciones para cartas
            setCardViewMode: (cardViewMode) => set({ cardViewMode }),

            setCardsPerPage: (cardsPerPage) => set({ cardsPerPage }),

            setDefaultCardSort: (defaultCardSort) => set({ defaultCardSort }),

            setDefaultSortDirection: (defaultSortDirection) => set({ defaultSortDirection }),

            toggleShowCardDetails: () => set((state) => ({
                showCardDetails: !state.showCardDetails
            })),

            // Acciones para notificaciones
            toggleNotifications: () => set((state) => ({
                notificationsEnabled: !state.notificationsEnabled
            })),

            toggleEmailNotifications: () => set((state) => ({
                emailNotificationsEnabled: !state.emailNotificationsEnabled
            })),

            // Acciones para idioma
            setLanguage: (language) => set({ language }),

            // Acciones para comportamiento
            toggleAutoSaveDeck: () => set((state) => ({
                autoSaveDeck: !state.autoSaveDeck
            })),

            toggleConfirmBeforeDelete: () => set((state) => ({
                confirmBeforeDelete: !state.confirmBeforeDelete
            })),

            toggleShowTips: () => set((state) => ({
                showTips: !state.showTips
            })),

            // Resetear a valores por defecto
            resetToDefaults: () => set(defaultPreferences)
        }),
        {
            name: 'kodem-user-preferences',
            storage: createJSONStorage(() => localStorage)
        }
    )
);

// Exportar store base directamente
export const useUserPreferencesStore = useUserPreferencesStoreBase;

// Selectores derivados y utilidades
export const useTheme = () => {
    const { theme } = useUserPreferencesStore();

    // Utilidad para determinar el tema real según la preferencia
    const getEffectiveTheme = (): 'light' | 'dark' => {
        if (theme === 'system') {
            // Detectar preferencia del sistema
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return systemPrefersDark ? 'dark' : 'light';
        }
        return theme;
    };

    return {
        theme,
        effectiveTheme: getEffectiveTheme(),
        isDarkMode: getEffectiveTheme() === 'dark'
    };
}; 