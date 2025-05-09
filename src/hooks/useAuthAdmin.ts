import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchRolePermissions } from '@/lib/auth-utils';

/**
 * Hook personalizado para funciones administrativas de autenticación
 * @returns Funciones para administrar la autenticación y permisos
 */
export function useAuthAdmin() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    /**
     * Fuerza la recarga de los permisos desde Firestore, omitiendo la caché
     * @param callback Función opcional a ejecutar después de cargar los permisos
     */
    const forceReloadPermissions = useCallback(async (callback?: () => void) => {
        if (!user?.role) {
            setError('No hay rol de usuario disponible');
            return null;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Borrar permisos en caché
            localStorage.removeItem(`${user.role}_permissions`);

            // Cargar permisos frescos desde Firestore
            const permissions = await fetchRolePermissions(user.role);

            if (permissions) {
                const permissionsList = Object.keys(permissions);
                setSuccess(`Permisos cargados: ${permissionsList.join(', ')}`);

                if (callback) {
                    callback();
                }

                return permissions;
            } else {
                setError(`No se encontraron permisos para el rol: ${user.role}`);
                return null;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al cargar permisos: ${errorMessage}`);
            console.error('Error al cargar permisos:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Depura la estructura de permisos en Firestore
     */
    const debugPermissionsStructure = useCallback(async () => {
        if (!user?.role) {
            setError('No hay rol de usuario disponible');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            // Cargar documento directamente
            const permissions = await fetchRolePermissions(user.role);

            return permissions;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al depurar permisos: ${errorMessage}`);
            console.error('Error al depurar permisos:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        forceReloadPermissions,
        debugPermissionsStructure,
        loading,
        error,
        success
    };
}

export default useAuthAdmin; 