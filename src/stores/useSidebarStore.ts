import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SidebarState {
    isCollapsed: boolean;
    isSmallScreen: boolean;
    isMobileView: boolean;
    lastState: 'expanded' | 'collapsed';
}

interface SidebarActions {
    toggleCollapsed: () => void;
    setSmallScreen: (isSmall: boolean) => void;
    resetToDefault: () => void;
}

export type SidebarStore = SidebarState & SidebarActions;

const DEFAULT_STATE: SidebarState = {
    isCollapsed: false,
    isSmallScreen: false,
    isMobileView: false,
    lastState: 'expanded',
};

export const useSidebarStore = create<SidebarStore>()(
    persist(
        (set) => ({
            ...DEFAULT_STATE,

            toggleCollapsed: () =>
                set((state) => {
                    if (state.isSmallScreen) {
                        return state;
                    }
                    
                    const isCollapsed = !state.isCollapsed;
                    return {
                        isCollapsed,
                        lastState: isCollapsed ? 'collapsed' : 'expanded',
                    };
                }),

            setSmallScreen: (isSmall: boolean) =>
                set((state) => ({
                    isSmallScreen: isSmall,
                    isCollapsed: isSmall ? true : state.lastState === 'collapsed',
                    isMobileView: isSmall,
                })),

            resetToDefault: () => set(DEFAULT_STATE),
        }),
        {
            name: 'sidebar-storage',
            partialize: (state) => ({
                isCollapsed: state.isCollapsed,
                lastState: state.lastState
            }),
        }
    )
); 