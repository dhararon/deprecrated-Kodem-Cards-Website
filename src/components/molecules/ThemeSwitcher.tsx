import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/atoms/DropdownMenu';
import { cn } from '@/lib/utils';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeSwitcherProps {
    /**
     * Tema actual seleccionado
     */
    theme?: Theme;

    /**
     * Función llamada al cambiar el tema
     */
    onThemeChange?: (theme: Theme) => void;

    /**
     * Clases adicionales para el componente
     */
    className?: string;

    /**
     * Si es true, muestra un botón más pequeño sin texto
     */
    compact?: boolean;

    /**
     * Alineación del menú desplegable
     */
    align?: 'start' | 'center' | 'end';
}

/**
 * ThemeSwitcher - Componente para cambiar entre temas claro, oscuro y sistema
 */
export function ThemeSwitcher({
    theme: controlledTheme,
    onThemeChange,
    className,
    compact = false,
    align = 'end'
}: ThemeSwitcherProps) {
    const [theme, setTheme] = useState<Theme>('system');

    // Sincronizar con el tema controlado si se proporciona
    useEffect(() => {
        if (controlledTheme) {
            setTheme(controlledTheme);
        }
    }, [controlledTheme]);

    // Si no hay un tema controlado, detectar el tema del sistema
    useEffect(() => {
        if (!controlledTheme) {
            // Obtener tema del localStorage
            const storedTheme = localStorage.getItem('theme') as Theme;

            if (storedTheme) {
                setTheme(storedTheme);
                applyTheme(storedTheme);
            } else {
                // Detectar tema del sistema
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                setTheme('system');
                applyTheme(systemTheme);
            }
        }
    }, [controlledTheme]);

    // Función para aplicar el tema al documento
    const applyTheme = (newTheme: Theme) => {
        const root = window.document.documentElement;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        // Eliminar clases antiguas
        root.classList.remove('light', 'dark');

        // Aplicar la clase según el tema seleccionado
        if (newTheme === 'system') {
            root.classList.add(systemTheme);
        } else {
            root.classList.add(newTheme);
        }
    };

    // Función para cambiar el tema
    const changeTheme = (newTheme: Theme) => {
        if (onThemeChange) {
            // Componente controlado
            onThemeChange(newTheme);
        } else {
            // Componente no controlado
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);

            if (newTheme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                applyTheme(systemTheme);
            } else {
                applyTheme(newTheme);
            }
        }
    };

    // Escuchar cambios en el tema del sistema si está en modo "system"
    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = () => {
                if (theme === 'system') {
                    applyTheme('system');
                }
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // Renderizar icono según el tema actual
    const renderIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="h-4 w-4" />;
            case 'dark':
                return <Moon className="h-4 w-4" />;
            case 'system':
                return <Monitor className="h-4 w-4" />;
            default:
                return <Sun className="h-4 w-4" />;
        }
    };

    // Obtener etiqueta de texto según el tema
    const getThemeLabel = (themeValue: Theme): string => {
        switch (themeValue) {
            case 'light':
                return 'Claro';
            case 'dark':
                return 'Oscuro';
            case 'system':
                return 'Sistema';
            default:
                return 'Desconocido';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="primary"
                    size={compact ? "sm" : "md"}
                    className={cn(
                        "gap-2",
                        compact ? "w-9 px-0" : "px-3",
                        className
                    )}
                    aria-label="Cambiar tema"
                >
                    {renderIcon()}
                    {!compact && <span>{getThemeLabel(theme)}</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align}>
                <DropdownMenuItem onClick={() => changeTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Oscuro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>Sistema</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 