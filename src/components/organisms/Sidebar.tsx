import React, { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarContext } from '@/hooks/useSidebar';
import { Database } from 'lucide-react';
import { Sidebar as SidebarComponent } from '@/components/molecules/Sidebar';
import { createDefaultSections } from '@/components/molecules/SidebarUtils';

/**
 * Sidebar - Barra lateral de navegación principal con secciones personalizadas según el rol del usuario
 */
export function Sidebar() {
    const { logout, user, debugAuthInfo } = useAuth();
    const { isCollapsed } = useSidebarContext();

    // Verificación mejorada para rol admin con logs
    const authInfo = debugAuthInfo();
    console.log('Sidebar - Información de autenticación:', authInfo);

    // Primera verificación: rol explícito
    const isAdminByRole = user?.role === 'admin';
    console.log('Sidebar - isAdminByRole:', isAdminByRole);

    // Segunda verificación: claims directamente
    const claims = user?.claims || {};
    const isAdminByClaim = claims.role === 'admin' || claims.admin === true;
    console.log('Sidebar - isAdminByClaim:', isAdminByClaim);

    // Usar cualquiera de las verificaciones
    const isAdmin = isAdminByRole || isAdminByClaim;
    console.log('Sidebar - isAdmin (final):', isAdmin);

    // Obtener secciones personalizadas según el rol del usuario
    const getSections = useCallback(() => {
        const defaultSections = createDefaultSections();

        // Añadir enlaces de administración si el usuario es admin
        if (isAdmin) {
            console.log('Sidebar - Añadiendo sección de administración');
            defaultSections.push({
                title: 'Administración',
                links: [
                    { text: 'Gestión de Cartas', href: '/admin/cards', icon: <Database className="h-4 w-4" /> }
                ]
            });
        } else {
            console.log('Sidebar - Usuario no es admin, no se muestra sección de administración');
        }

        return defaultSections;
    }, [isAdmin]);

    return (
        <SidebarComponent
            sections={getSections()}
            defaultCollapsed={isCollapsed}
            collapsible={true}
            onSignOut={logout}
            logo={
                <div className="flex items-center space-x-2">
                    {!isCollapsed && <span className="text-xl font-bold">Kodem Cards</span>}
                </div>
            }
        />
    );
}

// Exportación por defecto para mantener compatibilidad con las importaciones existentes
export default Sidebar; 