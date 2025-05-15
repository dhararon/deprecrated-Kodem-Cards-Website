import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { Link } from 'wouter';
import {
    LogOut as ExitIcon,
} from 'lucide-react';
import { SidebarSection } from './SidebarUtils';

export interface SidebarProps {
    sections: SidebarSection[];
    className?: string;
    logo?: React.ReactNode;
    footer?: React.ReactNode;
    onSignOut?: () => void;
}

/**
 * Sidebar - Componente de navegación lateral estático
 */
export function Sidebar({
    sections,
    className,
    logo,
    footer,
    onSignOut
}: SidebarProps) {
    // Clases para el sidebar (siempre ancho fijo)
    const sidebarClasses = cn(
        'flex flex-col h-screen bg-card border-r border-border w-64',
        className
    );

    // Clases para overlay modal en móvil
    const mobileSidebarClasses = cn(
        'fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden opacity-0 pointer-events-none'
    );

    // Clases para el contenido del sidebar móvil
    const mobileSidebarContentClasses = cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform -translate-x-full'
    );

    // Renderizar los enlaces de navegación
    const renderNavigationLinks = (section: SidebarSection, index: number) => {
        return (
            <div key={index} className="mb-4">
                {section.title && (
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {section.title}
                    </h3>
                )}
                <ul className="space-y-1">
                    {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                            <Link
                                href={link.href}
                                className={cn(
                                    'flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors justify-start'
                                )}
                            >
                                <span className="flex items-center justify-center w-6 h-6">
                                    {link.icon}
                                </span>
                                        <span className="ml-3 flex-1">{link.text}</span>
                                        {link.badge && (
                                            <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                                {link.badge}
                                            </span>
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
            <div className={cn("flex items-center py-4 px-3 justify-start")}>{logo}</div>
        );
    };

    // Renderizar el footer
    const renderFooter = () => {
        if (!footer && !onSignOut) return null;
        return (
            <div className={cn(
                "border-t border-border py-4 bg-card px-3 sticky bottom-0 z-10 shadow-sm"
            )}>
                {footer}
                {onSignOut && (
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={onSignOut}
                        className="text-muted-foreground hover:text-foreground transition-colors w-full justify-start"
                    >
                        <ExitIcon className="h-4 w-4" />
                        <span className="ml-2">Cerrar sesión</span>
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
        </>
    );
} 