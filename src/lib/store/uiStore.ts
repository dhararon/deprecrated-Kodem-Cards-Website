import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    // Tema
    isDarkMode: boolean;
    // Preferencias de UI
    sidebarCollapsed: boolean;
    tableViewMode: 'compact' | 'comfortable' | 'spacious';
    animationsEnabled: boolean;
    // Métodos
    toggleDarkMode: () => void;
    toggleSidebar: () => void;
    setTableViewMode: (mode: 'compact' | 'comfortable' | 'spacious') => void;
    toggleAnimations: () => void;
    // Notificaciones
    showConfirmations: boolean;
    notificationDuration: number;
    toggleConfirmations: () => void;
    setNotificationDuration: (duration: number) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Tema - por defecto detecta preferencia del sistema
            isDarkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,

            // Preferencias de UI
            sidebarCollapsed: false,
            tableViewMode: 'comfortable',
            animationsEnabled: true,

            // Notificaciones
            showConfirmations: true,
            notificationDuration: 4000,

            // Métodos
            toggleDarkMode: () => {
                set((state) => {
                    const newDarkMode = !state.isDarkMode;

                    // Aplica el tema al documento HTML
                    if (newDarkMode) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }

                    return { isDarkMode: newDarkMode };
                });
            },

            toggleSidebar: () => {
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
            },

            setTableViewMode: (mode) => {
                set({ tableViewMode: mode });
            },

            toggleAnimations: () => {
                set((state) => ({ animationsEnabled: !state.animationsEnabled }));
            },

            toggleConfirmations: () => {
                set((state) => ({ showConfirmations: !state.showConfirmations }));
            },

            setNotificationDuration: (duration) => {
                set({ notificationDuration: duration });
            }
        }),
        {
            name: 'pdtgrading-ui-preferences',
            // Solo guarda estas propiedades en localStorage
            partialize: (state) => ({
                isDarkMode: state.isDarkMode,
                sidebarCollapsed: state.sidebarCollapsed,
                tableViewMode: state.tableViewMode,
                animationsEnabled: state.animationsEnabled,
                showConfirmations: state.showConfirmations,
                notificationDuration: state.notificationDuration
            })
        }
    )
);

// Inicializa el tema al cargar
if (typeof window !== 'undefined') {
    const initialState = useUIStore.getState();
    if (initialState.isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
} 