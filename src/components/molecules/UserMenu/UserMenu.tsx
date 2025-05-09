import React from 'react';
import { Link } from 'wouter';
import {
    Settings,
    LogOut,
    ChevronDown,
    UserCircle2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/atoms/DropdownMenu";
import { Button } from '@/components/atoms/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { UserMenuOption } from './constants';

export interface UserMenuProps {
    user: {
        name: string;
        email: string;
        avatarUrl?: string;
    } | null;
    profileOptions?: UserMenuOption[];
    onSignOut?: () => void;
    className?: string;
    align?: 'start' | 'center' | 'end';
}

/**
 * UserMenu - Menú desplegable con información del usuario y opciones de perfil
 */
export function UserMenu({
    user,
    profileOptions = [],
    onSignOut,
    className,
    align = 'end'
}: UserMenuProps) {
    if (!user) {
        return (
            <div className={className}>
                <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                        Iniciar sesión
                    </Button>
                </Link>
            </div>
        );
    }

    // Obtener iniciales para el avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0]?.toUpperCase() ?? '')
            .join('')
            .substring(0, 2);
    };

    return (
        <div className={className}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-2 hover:bg-accent rounded-full"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm hidden md:inline-block max-w-[100px] truncate">
                            {user.name}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={align} className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer w-full">
                                <UserCircle2 className="mr-2 h-4 w-4" />
                                <span>Mi perfil</span>
                            </Link>
                        </DropdownMenuItem>
                        {profileOptions.map((option, index) => (
                            <DropdownMenuItem
                                key={index}
                                asChild={!!option.href}
                                onClick={option.onClick}
                            >
                                {option.href ? (
                                    <Link href={option.href} className="cursor-pointer w-full">
                                        {option.icon && <span className="mr-2">{option.icon}</span>}
                                        <span>{option.label}</span>
                                    </Link>
                                ) : (
                                    <>
                                        {option.icon && <span className="mr-2">{option.icon}</span>}
                                        <span>{option.label}</span>
                                    </>
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="cursor-pointer w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Ajustes</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={onSignOut}
                        className="text-red-500 focus:text-red-500 cursor-pointer"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
} 