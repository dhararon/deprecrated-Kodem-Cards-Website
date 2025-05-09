import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { Link } from 'wouter';
import {
    Menu as HamburgerMenuIcon,
    X as Cross1Icon,
    LogOut as ExitIcon,
} from 'lucide-react';
import { SidebarSection } from './SidebarUtils';

export interface SidebarProps {
    sections: SidebarSection[];
    className?: string;
    logo?: React.ReactNode;
    footer?: React.ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    mobileCollapsible?: boolean;
    onSignOut?: () => void;
}

/**
 * Sidebar - Componente de navegación lateral con soporte para múltiples secciones y estados colapsados
 */
export function Sidebar({
    sections,
    className,
    logo,
    footer,
    collapsible = true,
    defaultCollapsed = false,
    mobileCollapsible = true,
    onSignOut
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Manejar colapso del sidebar
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Manejar menú móvil
    const toggleMobileMenu = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    // Manejar navegación para cerrar menú en móvil
    const handleNavigation = () => {
        setIsMobileOpen(false);
    };

    // Clases para el sidebar
    const sidebarClasses = cn(
        'flex flex-col h-screen bg-card border-r border-border',
        isCollapsed ? 'w-16' : 'w-64',
        className
    );

    // Clases para overlay modal en móvil
    const mobileSidebarClasses = cn(
        'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden',
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    );

    // Clases para el contenido del sidebar móvil
    const mobileSidebarContentClasses = cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
    );

    // Renderizar botón de colapsar/expandir
    const renderCollapseButton = () => {
        if (!collapsible) return null;

        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="ml-auto mr-2"
                aria-label={isCollapsed ? "Expandir" : "Colapsar"}
            >
                {isCollapsed ? (
                    <HamburgerMenuIcon className="h-4 w-4" />
                ) : (
                    <Cross1Icon className="h-4 w-4" />
                )}
            </Button>
        );
    };

    // Renderizar los enlaces de navegación
    const renderNavigationLinks = (section: SidebarSection, index: number) => {
        return (
            <div key={index} className="mb-4">
                {section.title && !isCollapsed && (
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {section.title}
                    </h3>
                )}
                <ul className="space-y-1">
                    {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                            <Link
                                href={link.href}
                                onClick={() => handleNavigation()}
                                className={cn(
                                    'flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                                    isCollapsed ? 'justify-center' : 'justify-start'
                                )}
                            >
                                <span className="flex items-center justify-center w-6 h-6">
                                    {link.icon}
                                </span>
                                {!isCollapsed && (
                                    <>
                                        <span className="ml-3 flex-1">{link.text}</span>
                                        {link.badge && (
                                            <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                                {link.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Renderizar el logo
    const renderLogo = () => {
        if (!logo) return null;

        return (
            <div className={cn("flex items-center py-4 px-3", isCollapsed ? "justify-center" : "")}>
                {logo}
                {renderCollapseButton()}
            </div>
        );
    };

    // Renderizar el footer
    const renderFooter = () => {
        if (!footer && !onSignOut) return null;

        return (
            <div className={cn(
                "border-t border-border py-4 bg-card",
                isCollapsed ? "px-2" : "px-3",
                "sticky bottom-0 z-10 shadow-sm"
            )}>
                {!isCollapsed && footer}
                {onSignOut && (
                    <Button
                        variant="ghost"
                        size={isCollapsed ? "icon" : "default"}
                        onClick={onSignOut}
                        className={cn(
                            "text-muted-foreground hover:text-foreground transition-colors w-full",
                            isCollapsed ? "justify-center" : ""
                        )}
                    >
                        <ExitIcon className="h-4 w-4" />
                        {!isCollapsed && <span className="ml-2">Cerrar sesión</span>}
                    </Button>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Sidebar para pantallas grandes */}
            <aside className={cn(sidebarClasses, "hidden lg:flex")}>
                {renderLogo()}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    {sections.map(renderNavigationLinks)}
                </nav>
                {renderFooter()}
            </aside>

            {/* Botón de menú móvil */}
            {mobileCollapsible && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMobileMenu}
                    className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg lg:hidden"
                >
                    {isMobileOpen ? (
                        <Cross1Icon className="h-5 w-5" />
                    ) : (
                        <HamburgerMenuIcon className="h-5 w-5" />
                    )}
                </Button>
            )}

            {/* Sidebar para móviles */}
            <div className={mobileSidebarClasses} onClick={toggleMobileMenu}>
                <aside
                    className={mobileSidebarContentClasses}
                    onClick={(e) => e.stopPropagation()}
                >
                    {renderLogo()}
                    <nav className="flex-1 overflow-y-auto py-4 px-2">
                        {sections.map(renderNavigationLinks)}
                    </nav>
                    {renderFooter()}
                </aside>
            </div>
        </>
    );
} 