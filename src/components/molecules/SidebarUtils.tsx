import React from 'react';
import {
    Home as HomeIcon,
    LayoutGrid as CardStackIcon,
    Settings as GearIcon,
    Rocket as RocketIcon,
    Plus as PlusIcon,
    LogOut as ExitIcon,
    Zap as LightningBoltIcon,
    Library as LibraryIcon,
    Heart as HeartIcon,
} from 'lucide-react';

// Tipos exportados
export interface SidebarLink {
    text: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
}

export interface SidebarSection {
    title?: string;
    links: SidebarLink[];
}

/**
 * Funciones de ayuda para crear enlaces de sidebar predefinidos
 */
export const sidebarIcons = {
    home: <HomeIcon className="h-4 w-4" />,
    decks: <CardStackIcon className="h-4 w-4" />,
    settings: <GearIcon className="h-4 w-4" />,
    explore: <RocketIcon className="h-4 w-4" />,
    new: <PlusIcon className="h-4 w-4" />,
    logout: <ExitIcon className="h-4 w-4" />,
    lightning: <LightningBoltIcon className="h-4 w-4" />,
    library: <LibraryIcon className="h-4 w-4" />,
    heart: <HeartIcon className="h-4 w-4" />,
    feed: <RocketIcon className="h-4 w-4" />
};

export const createDefaultSections = (badgeCount?: number): SidebarSection[] => [
    {
        title: 'Colecciones',
        links: [
            {
                text: 'Mi Colección',
                href: '/collection',
                icon: sidebarIcons.library,
                badge: badgeCount
            },
            {
                text: 'Listas de Deseos',
                href: '/wishlists',
                icon: sidebarIcons.heart
            },
            {
                text: 'Selector de Cartas',
                href: '/cards/selector',
                icon: sidebarIcons.new
            }
        ]
    },
    {
        "title": "Mazos",
        "links": [
            {
                "text": "Mis Mazos",
                "href": "/decks",
                "icon": sidebarIcons.decks
            },
            {
                "text": "Explorar Mazos",
                "href": "/decks/feed",
                "icon": sidebarIcons.feed
            }
        ]
    }
]; 