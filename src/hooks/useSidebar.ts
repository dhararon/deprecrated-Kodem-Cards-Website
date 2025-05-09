import { useEffect, useCallback } from 'react';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useContext } from 'react';
import { SidebarContext, SidebarContextType } from '@/context/sidebar/SidebarContext';

// Breakpoints para responsive design
const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
};

// Hook personalizado para manejo del sidebar
export function useSidebar() {
    const {
        isCollapsed,
        toggleCollapsed,
        isSmallScreen,
        setSmallScreen
    } = useSidebarStore();

    // Manejar cambios en el tamaño de la ventana
    const handleResize = useCallback(() => {
        const screenWidth = window.innerWidth;
        const isMobile = screenWidth < BREAKPOINTS.md;

        // Solo actualizar si realmente cambió el estado
        if (isMobile !== isSmallScreen) {
            setSmallScreen(isMobile);
        }
    }, [isSmallScreen, setSmallScreen]);

    // Detectar tamaño de pantalla al montar el componente
    useEffect(() => {
        // Verificar tamaño inicial
        handleResize();

        // Escuchar cambios de tamaño
        window.addEventListener('resize', handleResize);

        // Limpiar listener al desmontar
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    return {
        isCollapsed,
        isSmallScreen,
        toggleCollapsed,
        breakpoints: BREAKPOINTS,
    };
}

/**
 * Hook para acceder al contexto del sidebar
 * @returns El contexto del sidebar
 */
export const useSidebarContext = (): SidebarContextType => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebarContext debe ser usado dentro de un SidebarProvider');
    }
    return context;
};

export default useSidebarContext; 