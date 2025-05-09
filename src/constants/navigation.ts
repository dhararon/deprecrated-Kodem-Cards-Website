import {
    HomeIcon,
    ChartBarIcon,
    UserIcon,
    CogIcon,
    BellIcon,
    CalendarIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

export const NAVIGATION_ITEMS = [
    {
        name: 'Dashboard',
        href: '/',
        icon: HomeIcon,
    },
    {
        name: 'Analytics',
        href: '/analytics',
        icon: ChartBarIcon,
    },
    {
        name: 'Calendar',
        href: '/calendar',
        icon: CalendarIcon,
    },
    {
        name: 'Documents',
        href: '/documents',
        icon: DocumentTextIcon,
    },
    {
        name: 'Notifications',
        href: '/notifications',
        icon: BellIcon,
    },
    {
        name: 'Profile',
        href: '/profile',
        icon: UserIcon,
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: CogIcon,
    },
];

export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest',
} as const;

export const THEME_OPTIONS = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const; 