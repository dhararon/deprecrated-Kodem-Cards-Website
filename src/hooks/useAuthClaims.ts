import { useAuth } from '@/hooks/useAuth';
import { determineUserRoleFromClaims } from '@/lib/auth-utils';

/**
 * Hook personalizado para acceder a los claims de autenticación
 * 
 * @returns Un objeto con los claims de Firebase Auth almacenados localmente
 */
export function useAuthClaims<T = Record<string, unknown>>(): T | null {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return null;
    }

    try {
        const claimsString = localStorage.getItem('auth_claims');
        if (!claimsString) {
            return null;
        }

        return JSON.parse(claimsString) as T;
    } catch (error) {
        console.error('Error al leer los claims de autenticación:', error);
        return null;
    }
}

/**
 * Función para obtener un claim específico del almacenamiento local
 * 
 * @param claimKey - La clave del claim que se desea obtener
 * @returns El valor del claim o null si no existe o hay un error
 */
export function getAuthClaim<T = unknown>(claimKey: string): T | null {
    try {
        const claimsString = localStorage.getItem('auth_claims');
        if (!claimsString) {
            return null;
        }

        const claims = JSON.parse(claimsString);
        return claims[claimKey] as T || null;
    } catch (error) {
        console.error(`Error al leer el claim '${claimKey}':`, error);
        return null;
    }
}

/**
 * Obtiene los claims almacenados sin usar el hook (útil para funciones de utilidad)
 */
export function getStoredClaims<T = Record<string, unknown>>(): T | null {
    try {
        const claimsString = localStorage.getItem('auth_claims');
        if (!claimsString) {
            return null;
        }
        return JSON.parse(claimsString) as T;
    } catch (error) {
        console.error('Error al leer los claims:', error);
        return null;
    }
}

/**
 * Función que devuelve el rol del usuario basado en sus claims
 * IMPORTANTE: Esta función NO es un hook y debe usarse en componentes React
 * a través del hook useAuthClaims
 * 
 * @returns 'admin', 'staff', 'user' o null si no está autenticado
 */
export function getUserRoleFromClaims(claims: Record<string, unknown> | null): 'admin' | 'staff' | 'user' | null {
    if (!claims) {
        return null;
    }
    return determineUserRoleFromClaims(claims);
}

/**
 * Hook para obtener el rol del usuario. Este es el hook que debe usarse en componentes.
 */
export function useUserRole(): 'admin' | 'staff' | 'user' | null {
    const claims = useAuthClaims();
    return getUserRoleFromClaims(claims);
}

export default useAuthClaims; 