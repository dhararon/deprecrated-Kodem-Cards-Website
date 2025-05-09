import { getIdTokenResult, User } from 'firebase/auth';
import { auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Tipo para los claims de usuario
 */
export type UserClaims = Record<string, unknown>;

/**
 * Refresca los claims de autenticación y los actualiza en localStorage
 * 
 * Esta función es útil cuando necesitas asegurarte de tener los claims más recientes,
 * por ejemplo después de que un administrador haya actualizado los permisos del usuario.
 * 
 * @returns Promise que resuelve a los claims actualizados o null si no hay usuario
 */
export async function refreshAuthClaims(): Promise<UserClaims | null> {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn('refreshAuthClaims: No hay usuario autenticado');
            return null;
        }

        console.log('refreshAuthClaims: Obteniendo claims actuales...');

        // Limpiar cualquier caché de claims
        localStorage.removeItem('auth_claims');

        // Siempre forzar renovación del token
        console.log('refreshAuthClaims: Forzando renovación del token...');
        await currentUser.getIdToken(true);

        // Obtener el token renovado
        const tokenResult = await getIdTokenResult(currentUser, true);
        const claims = tokenResult.claims as UserClaims;

        console.log('refreshAuthClaims: Claims renovados:', claims);

        // Verificar específicamente role=admin
        if (claims.role === 'admin') {
            console.log('refreshAuthClaims: ✅ Usuario tiene role=admin en los claims');
        } else {
            console.log('refreshAuthClaims: ❌ Usuario NO tiene role=admin en los claims');
            console.log('refreshAuthClaims: Claims encontrados:', Object.keys(claims).join(', '));
        }

        // Actualizar localStorage con los claims renovados
        localStorage.setItem('auth_claims', JSON.stringify(claims));

        return claims;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        // Ignoramos el error para simplificar el manejo de errores
        return null;
    }
}

/**
 * Obtiene los permisos asociados al rol admin desde Firestore
 * 
 * @returns Promise que resuelve a un objeto con los permisos o null si hay error
 */
export async function fetchAdminPermissions(): Promise<UserClaims | null> {
    try {
        // Referencia al documento admin:role en la colección permissions
        const permissionsRef = doc(db, 'permissions', 'admin:role');
        const permissionsDoc = await getDoc(permissionsRef);

        if (!permissionsDoc.exists()) {
            return null;
        }

        const permissions = permissionsDoc.data();

        // Guardar los permisos en localStorage para acceso rápido
        localStorage.setItem('admin_permissions', JSON.stringify(permissions));

        return permissions as UserClaims;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        // Ignoramos el error para simplificar el manejo de errores
        return null;
    }
}

/**
 * Obtiene los permisos asociados a un rol específico desde Firestore
 * 
 * @param role El rol para el que se quieren obtener los permisos
 * @returns Promise que resuelve a un objeto con los permisos o null si hay error
 */
export async function fetchRolePermissions(role: string): Promise<UserClaims | null> {
    try {
        // Validar que el rol sea uno válido
        if (!role || typeof role !== 'string') {
            return null;
        }

        // Usar directamente el nombre del rol como ID del documento
        const docId = role;

        // Referencia al documento en la colección permissions
        const permissionsRef = doc(db, 'permissions', docId);
        const permissionsDoc = await getDoc(permissionsRef);

        if (!permissionsDoc.exists()) {
            return null;
        }

        const docData = permissionsDoc.data();

        // Extraer específicamente el array de permisos del documento
        const permissionsArray = docData.permissions;

        if (!permissionsArray) {
            return null;
        }

        // Si permissions no es un array, intentar usarlo directamente como objeto de permisos
        if (!Array.isArray(permissionsArray)) {
            if (typeof permissionsArray === 'object') {
                localStorage.setItem(`${role}_permissions`, JSON.stringify(permissionsArray));
                return permissionsArray as UserClaims;
            } else {
                return null;
            }
        }

        // Convertir el array de permisos a un objeto para facilitar su uso
        const permissionsObject: Record<string, boolean> = {};
        permissionsArray.forEach((permission: string) => {
            permissionsObject[permission] = true;
        });

        // Guardar los permisos en localStorage para acceso rápido
        localStorage.setItem(`${role}_permissions`, JSON.stringify(permissionsObject));

        return permissionsObject;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        // Ignoramos el error para simplificar el manejo de errores
        return null;
    }
}

/**
 * Verifica si el usuario tiene un claim específico con un valor determinado
 * 
 * @param user - Usuario de Firebase
 * @param claimName - Nombre del claim a verificar
 * @param claimValue - Valor esperado del claim
 * @returns Promise que resuelve a true si el usuario tiene el claim con el valor especificado
 */
export async function userHasClaim(
    user: User | null,
    claimName: string,
    claimValue: unknown
): Promise<boolean> {
    if (!user) return false;

    try {
        const tokenResult = await getIdTokenResult(user);
        return tokenResult.claims[claimName] === claimValue;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        // Ignoramos el error para simplificar el manejo de errores
        return false;
    }
}

/**
 * Obtiene todos los claims del token actual del usuario
 * 
 * @param user - Usuario de Firebase
 * @returns Promise que resuelve a un objeto con todos los claims o null
 */
export async function getUserClaims(user: User | null): Promise<UserClaims | null> {
    if (!user) return null;

    try {
        const tokenResult = await getIdTokenResult(user);
        return tokenResult.claims as UserClaims;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        // Ignoramos el error para simplificar el manejo de errores
        return null;
    }
}

/**
 * Determina el rol de un usuario basado en sus claims
 * 
 * @param claims - Claims del usuario
 * @returns 'admin', 'staff' o 'user' dependiendo de los claims
 */
export function determineUserRoleFromClaims(claims: UserClaims): 'admin' | 'staff' | 'user' {
    // Primero revisamos si existe un claim 'role' explícito
    if (claims.role) {
        const roleValue = String(claims.role);
        // Verificar que sea uno de los roles válidos
        if (['admin', 'staff', 'user'].includes(roleValue)) {
            return roleValue as 'admin' | 'staff' | 'user';
        }
    }

    // Si no hay claim 'role' o no es válido, revisamos los claims individuales
    if (claims.admin === true) {
        return 'admin';
    }

    if (claims.staff === true) {
        return 'staff';
    }

    // Por defecto, todos los usuarios tienen rol 'user'
    return 'user';
}

/**
 * Verifica si un usuario tiene un rol específico basado en sus claims
 * 
 * @param user - Usuario de Firebase
 * @param role - Rol a verificar: 'admin', 'staff' o 'user'
 * @returns Promise que resuelve a true si el usuario tiene el rol especificado
 */
export async function userHasRole(
    user: User | null,
    role: 'admin' | 'staff' | 'user'
): Promise<boolean> {
    if (!user) return false;

    try {
        const tokenResult = await getIdTokenResult(user);
        const claims = tokenResult.claims as UserClaims;

        // Verificar si existe el claim directo 'role'
        if (claims.role) {
            return claims.role === role;
        }

        // Si no hay claim 'role', verificar los claims individuales
        switch (role) {
            case 'admin':
                return claims.admin === true;
            case 'staff':
                return claims.staff === true;
            case 'user':
                // Todos los usuarios autenticados tienen al menos el rol de 'user'
                return true;
            default:
                return false;
        }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
        // Ignoramos el error para simplificar el manejo de errores
        return false;
    }
} 