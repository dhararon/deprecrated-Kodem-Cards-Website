import React from 'react';
import { User } from 'lucide-react';

export interface UserMenuOption {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
}

/**
 * Opciones predeterminadas de perfil de usuario
 */
export const defaultProfileOptions: UserMenuOption[] = [
    {
        label: 'Mis mazos',
        href: '/decks',
        icon: React.createElement(User, { className: "h-4 w-4" })
    }
]; 