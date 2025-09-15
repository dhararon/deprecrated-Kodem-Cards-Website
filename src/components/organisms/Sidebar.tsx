import React, { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarContext } from '@/hooks/useSidebar';
import { Database } from 'lucide-react';
import { Sidebar as SidebarComponent } from '@/components/molecules/Sidebar';
import { createDefaultSections } from '@/components/molecules/SidebarUtils';

/**
 * Topbar - Barra superior de navegación principal con secciones personalizadas según el rol del usuario
 */
export function Topbar() {
	const { logout, user, debugAuthInfo } = useAuth();
	const { isCollapsed } = useSidebarContext();

	// Verificación mejorada para rol admin con logs
	const authInfo = debugAuthInfo();
	console.log('Topbar - Información de autenticación:', authInfo);

	// Primera verificación: rol explícito
	const isAdminByRole = user?.role === 'admin';
	console.log('Topbar - isAdminByRole:', isAdminByRole);

	// Segunda verificación: claims directamente
	const claims = user?.claims || {};
	const isAdminByClaim = claims.role === 'admin' || claims.admin === true;
	console.log('Topbar - isAdminByClaim:', isAdminByClaim);

	// Usar cualquiera de las verificaciones
	const isAdmin = isAdminByRole || isAdminByClaim;
	console.log('Topbar - isAdmin (final):', isAdmin);

	// Obtener secciones personalizadas según el rol del usuario
	const getSections = useCallback(() => {
		const defaultSections = createDefaultSections();

		// Añadir enlaces de administración si el usuario es admin
		if (isAdmin) {
			console.log('Topbar - Añadiendo sección de administración');
			defaultSections.push({
				title: 'Administración',
				links: [
					{ text: 'Gestión de Cartas', href: '/admin/cards', icon: <Database className="h-4 w-4" /> }
				]
			});
		} else {
			console.log('Topbar - Usuario no es admin, no se muestra sección de administración');
		}

		return defaultSections;
	}, [isAdmin]);

	// Obtener la versión desde una variable de entorno
	const version = import.meta.env.VITE_APP_VERSION || 'v1.2.0';

	return (
		<header className="w-full h-16 flex items-center justify-between bg-card border-b border-border px-4 shadow-sm z-50">
			{/* Logo */}
			<div className="flex items-center space-x-2">
				{!isCollapsed && <span className="text-xl font-bold">Kodem Cards</span>}
			</div>

			{/* Navegación */}
			<nav className="flex-1 flex items-center justify-center space-x-6">
				{getSections().map((section, idx) => (
					<section key={idx} className="flex items-center space-x-2">
						{section.links.map((link, linkIdx) => (
							<a
								key={linkIdx}
								href={link.href}
								className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
							>
								<span className="flex items-center justify-center w-6 h-6">{link.icon}</span>
								<span className="ml-2">{link.text}</span>
								{link.badge && (
									<span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
										{link.badge}
									</span>
								)}
							</a>
						))}
					</section>
				))}
			</nav>

			{/* Footer y logout */}
			<div className="flex items-center space-x-4">
				<span className="text-xs text-muted-foreground select-none">Versión {version}</span>
				<button
					onClick={logout}
					className="flex items-center text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md"
				>
					<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
					<span className="ml-2">Cerrar sesión</span>
				</button>
			</div>
		</header>
	);
}

// Exportación por defecto para mantener compatibilidad con las importaciones existentes
export default Topbar; 