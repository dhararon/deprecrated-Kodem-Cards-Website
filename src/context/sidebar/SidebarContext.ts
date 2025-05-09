import { createContext } from 'react';

// Definición del tipo para el contexto
export interface SidebarContextType {
    isCollapsed: boolean;
    isSmallScreen: boolean;
    toggleCollapsed: () => void;
}

// Crear el contexto
export const SidebarContext = createContext<SidebarContextType | undefined>(undefined); 