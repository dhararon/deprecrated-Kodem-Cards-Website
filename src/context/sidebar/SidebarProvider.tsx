import React, { useState, useEffect, ReactNode } from 'react';
import { SidebarContext } from './SidebarContext';

interface SidebarProviderProps {
    children: ReactNode;
}

/**
 * Proveedor del contexto del Sidebar
 * Gestiona el estado del sidebar y detecta el tamaño de la pantalla
 */
const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);
    
    // Detectar tamaño de pantalla al cargar y al cambiar el tamaño de la ventana
    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 768);
        };
        
        // Comprobar tamaño inicial
        checkScreenSize();
        
        // Escuchar cambios de tamaño
        window.addEventListener('resize', checkScreenSize);
        
        // Limpiar el listener al desmontar
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    // Función para alternar el estado del sidebar
    const toggleCollapsed = () => {
        setIsCollapsed(prev => !prev);
    };
    
    return (
        <SidebarContext.Provider value={{ isCollapsed, isSmallScreen, toggleCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
};

export default SidebarProvider; 