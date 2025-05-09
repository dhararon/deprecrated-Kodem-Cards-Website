import { createContext, useContext } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    isSmallScreen: boolean;
    toggleCollapsed: () => void;
}

// Crear el contexto con valores predeterminados
export const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    isSmallScreen: false,
    toggleCollapsed: () => {}
});

// Hook personalizado para usar el contexto
export const useSidebarContext = () => useContext(SidebarContext); 