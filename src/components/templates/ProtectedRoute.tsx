import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/atoms/Spinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: ('admin' | 'user' | 'staff')[];
    redirectPath?: string;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * 
 * @param children Contenido a mostrar si el usuario está autenticado
 * @param requiredRoles Roles de usuario permitidos (opcional)
 * @param redirectPath Ruta a la que redirigir si no está autenticado (por defecto: '/login')
 */
export function ProtectedRoute({
    children,
    requiredRoles = [],
    redirectPath = '/login'
}: ProtectedRouteProps) {
    const [, navigate] = useLocation();
    const { isAuthenticated, user, isLoading } = useAuth();

    // Log para depuración
    useEffect(() => {
        console.log('ProtectedRoute estado:', { isAuthenticated, isLoading, userRole: user?.role });
    }, [isAuthenticated, isLoading, user]);

    // Efecto para redirigir si no está autenticado o no tiene rol permitido
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                console.log('Redirigiendo por no autenticado');
                toast.error('Acceso denegado', {
                    description: 'Debes iniciar sesión para acceder a esta página'
                });
                navigate(redirectPath);
            } else if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
                console.log('Redirigiendo por rol no permitido');
                toast.error('Acceso denegado', {
                    description: 'No tienes permisos para acceder a esta página'
                });
                navigate('/collection');
            }
        }
    }, [isAuthenticated, isLoading, user, navigate, redirectPath, requiredRoles]);

    // Mostrar spinner mientras verifica autenticación
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    // Si está autenticado y tiene el rol permitido (o no se especificaron roles), mostrar contenido
    if (isAuthenticated && (requiredRoles.length === 0 || (user && requiredRoles.includes(user.role)))) {
        return <>{children}</>;
    }

    // En cualquier otro caso, no mostrar nada (la redirección se maneja en el useEffect)
    return null;
}

export default ProtectedRoute; 