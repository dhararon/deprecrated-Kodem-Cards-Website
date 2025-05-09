import React, { useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
    User as FirebaseUser,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    getIdTokenResult,
    GoogleAuthProvider,
    signInWithPopup,
    UserCredential,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isUsingEmulators } from '@/lib/firebase';
import { fetchRolePermissions } from '@/lib/auth-utils';
import { useLocation } from 'wouter';
import cacheService from '@/lib/cache-service';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { AuthContext, User } from './AuthContext';

// Asignar un rol predeterminado para nuevos usuarios
const DEFAULT_USER_ROLE = 'user';

// Datos mock para desarrollo con emuladores
const EMULATOR_ADMIN_EMAIL = 'admin@example.com';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    
    const [, navigate] = useLocation();

    // Función auxiliar para validar que el rol sea uno de los valores permitidos
    const validateRole = useCallback((role: string): 'admin' | 'user' | 'staff' => {
        const validRoles = ['admin', 'user', 'staff'];
        if (validRoles.includes(role)) {
            return role as 'admin' | 'user' | 'staff';
        }
        return DEFAULT_USER_ROLE as 'admin' | 'user' | 'staff';
    }, []);

    // Cargar permisos basados en el rol del usuario
    const loadUserPermissions = useCallback(async (role: string): Promise<Record<string, unknown> | null> => {
        try {
            // Intentar obtener permisos del localStorage primero
            const cachedPermissions = localStorage.getItem(`${role}_permissions`);
            if (cachedPermissions) {
                return JSON.parse(cachedPermissions);
            }

            // Si no están en cache, cargarlos desde Firestore directamente con el rol como ID del documento
            const permissions = await fetchRolePermissions(role);

            return permissions;
        } catch {
            return null;
        }
    }, []);

    // Convertir FirebaseUser a nuestro tipo User
    const formatUser = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
        // Declarar defaultUser aquí para que esté disponible en toda la función
        let defaultUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Usuario',
            role: validateRole('user'),
            avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'Usuario')}&background=random&color=fff`,
            claims: {}
        };

        try {
            // Intentar obtener los claims existentes del localStorage primero
            let cachedClaims: Record<string, unknown> | null = null;
            try {
                const cachedClaimsJson = localStorage.getItem('auth_claims');
                if (cachedClaimsJson) {
                    cachedClaims = JSON.parse(cachedClaimsJson);
                    console.log('Claims encontrados en localStorage:', cachedClaims);
                }
            } catch (cacheError) {
                console.warn('Error al leer claims de localStorage:', cacheError);
            }

            // Obtener token solo si no hay claims en cache
            let claims: Record<string, unknown>;
            if (!cachedClaims) {
                try {
                    // Siempre forzar renovación del token en producción
                    await firebaseUser.getIdToken(true);
                    console.log('Token renovado correctamente');
                } catch (tokenError) {
                    console.error('Error al renovar token:', tokenError);
                }

                // Obtener el resultado del token siempre con forceRefresh=true
                const tokenResult = await getIdTokenResult(firebaseUser, true);
                claims = tokenResult.claims;
                console.log('Claims obtenidos del servidor:', claims);

                // Verificar específicamente si existe el claim role=admin
                if (claims.role === 'admin') {
                    console.log('✅ Usuario tiene role=admin en los claims');
                } else {
                    console.log('❌ Usuario NO tiene role=admin en los claims');
                    console.log('Claims encontrados:', Object.keys(claims).join(', '));
                }
            } else {
                claims = cachedClaims;
            }

            // Determinar el rol basado en los claims
            let userRole = 'user'; // Default role

            // Verificar claims individuales primero (tienen prioridad)
            if (claims.admin === true) {
                userRole = 'admin';
                console.log('⭐ Usuario asignado como ADMIN por claim admin=true');
            } else if (claims.staff === true) {
                userRole = 'staff';
                console.log('Usuario asignado como STAFF por claim staff=true');
            }
            // Si no hay claims individuales, verificar claim 'role'
            else if (claims.role) {
                if (['admin', 'staff', 'user'].includes(String(claims.role))) {
                    userRole = String(claims.role);
                    console.log(`⭐ Usuario asignado como ${userRole.toUpperCase()} por claim role=${claims.role}`);
                }
            }

            // Actualizar claims en localStorage si obtuvimos nuevos
            if (!cachedClaims) {
                localStorage.setItem('auth_claims', JSON.stringify(claims));
            }

            // Actualizar defaultUser con los claims obtenidos
            defaultUser = {
                ...defaultUser,
                role: validateRole(userRole),
                claims
            };

            console.log(`Usuario formateado con rol: ${defaultUser.role}`);

            // En los emuladores, podemos asignar roles específicos para pruebas
            if (isUsingEmulators) {
                // Asignar rol admin en el emulador a un email específico para pruebas
                if (firebaseUser.email === EMULATOR_ADMIN_EMAIL) {
                    const adminUser: User = {
                        ...defaultUser,
                        role: 'admin'
                    };

                    // Cargar permisos del rol admin
                    const permissions = await loadUserPermissions('admin');
                    if (permissions) {
                        adminUser.permissions = permissions;
                    }

                    return adminUser;
                }

                return defaultUser;
            }

            try {
                // Intentar obtener el rol del usuario desde Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const userRole = validateRole(userData.role || DEFAULT_USER_ROLE);

                    // Crear objeto de usuario con datos básicos
                    const formattedUser: User = {
                        ...defaultUser,
                        role: userRole,
                        name: userData.name || defaultUser.name
                    };

                    // Cargar permisos basados en el rol exacto del usuario
                    const permissions = await loadUserPermissions(userRole);
                    if (permissions) {
                        formattedUser.permissions = permissions;
                    }

                    return formattedUser;
                } else {
                    // Si el documento no existe, intentar crearlo con el rol por defecto
                    try {
                        await setDoc(doc(db, 'users', firebaseUser.uid), {
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || 'Usuario',
                            role: DEFAULT_USER_ROLE,
                            createdAt: new Date().toISOString()
                        });
                    } catch {
                        // Ignorar errores de creación
                    }
                }
            } catch {
                if (!isUsingEmulators) {
                    toast.error('Error al acceder a los datos de usuario. Algunas funciones pueden estar limitadas.');
                }
            }
        } catch {
            if (!isUsingEmulators) {
                toast.error('Error al acceder a los datos de usuario. Algunas funciones pueden estar limitadas.');
            }
        }

        // Si hay errores, devolver el usuario predeterminado
        return defaultUser;
    }, [loadUserPermissions, validateRole]);

    // Escuchar cambios en el estado de autenticación
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setIsLoading(true);
            try {
                if (firebaseUser) {
                    // Borrar cualquier caché de claims al iniciar sesión
                    localStorage.removeItem('auth_claims');

                    // Forzar renovación del token al iniciar sesión
                    try {
                        await firebaseUser.getIdToken(true);
                        console.log('Token renovado al iniciar sesión');
                    } catch (e) {
                        console.error('Error al renovar token en inicio de sesión:', e);
                    }

                    const formattedUser = await formatUser(firebaseUser);
                    setUser(formattedUser);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    // Limpiar claims y permisos del localStorage al cerrar sesión
                    localStorage.removeItem('auth_claims');
                    localStorage.removeItem('admin_permissions');
                    localStorage.removeItem('user_permissions');
                    localStorage.removeItem('staff_permissions');
                }
            } catch {
                setUser(null);
                setIsAuthenticated(false);
                // Limpiar claims y permisos del localStorage en caso de error
                localStorage.removeItem('auth_claims');
                localStorage.removeItem('admin_permissions');
                localStorage.removeItem('user_permissions');
                localStorage.removeItem('staff_permissions');
            } finally {
                setIsLoading(false);
            }
        });

        // Limpiar al desmontar
        return () => unsubscribe();
    }, [formatUser]);

    // Función para iniciar sesión
    const login = useCallback(async (email: string, password: string): Promise<UserCredential> => {
        try {
            setIsLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const formattedUser = await formatUser(userCredential.user);
            
            // Actualizar explícitamente el estado de usuario y autenticación
            setUser(formattedUser);
            setIsAuthenticated(true);
            
            // Guardar explícitamente los claims en localStorage si no están ya
            if (formattedUser.claims && Object.keys(formattedUser.claims).length > 0) {
                localStorage.setItem('auth_claims', JSON.stringify(formattedUser.claims));
            }
            
            toast.success(`Bienvenido, ${formattedUser.name}`);
            
            // Agregar un pequeño retraso para asegurar que el estado se actualice completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            return userCredential;
        } catch (error: unknown) {
            let errorMessage = 'Ocurrió un error al iniciar sesión';

            if (typeof error === 'object' && error !== null && 'code' in error) {
                const errorCode = (error as { code: string }).code;
                if (errorCode === 'auth/invalid-credential') {
                    errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
                } else if (errorCode === 'auth/user-not-found') {
                    errorMessage = 'No existe una cuenta con este email.';
                } else if (errorCode === 'auth/wrong-password') {
                    errorMessage = 'Contraseña incorrecta.';
                } else if (errorCode === 'auth/too-many-requests') {
                    errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
                }
            }

            toast.error(errorMessage);
            setAuthError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [formatUser]);

    // Función para registrar un nuevo usuario
    const register = useCallback(async (email: string, password: string, name: string): Promise<UserCredential> => {
        try {
            setIsLoading(true);

            // Crear el usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Actualizar el perfil con el nombre
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Crear documento del usuario en Firestore
            try {
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email,
                    name,
                    role: DEFAULT_USER_ROLE,
                    createdAt: new Date().toISOString()
                });
            } catch {
                // Ignorar errores de creación
            }

            toast.success('Cuenta creada exitosamente');
            return userCredential;
        } catch (error: unknown) {
            let errorMessage = 'Ocurrió un error al crear la cuenta';

            if (typeof error === 'object' && error !== null && 'code' in error) {
                const errorCode = (error as { code: string }).code;
                if (errorCode === 'auth/email-already-in-use') {
                    errorMessage = 'Este email ya está en uso.';
                } else if (errorCode === 'auth/invalid-email') {
                    errorMessage = 'El formato del email es inválido.';
                } else if (errorCode === 'auth/weak-password') {
                    errorMessage = 'La contraseña es demasiado débil.';
                }
            }

            toast.error(errorMessage);
            setAuthError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Función para cerrar sesión
    const logout = useCallback(async (): Promise<void> => {
        try {
            await signOut(auth);
            // Limpiar claims y permisos del localStorage al cerrar sesión
            localStorage.removeItem('auth_claims');
            localStorage.removeItem('admin_permissions');
            localStorage.removeItem('user_permissions');
            localStorage.removeItem('staff_permissions');
            toast.info('Has cerrado sesión correctamente');
            navigate('/');
        } catch {
            toast.error('Error al cerrar sesión');
        }
    }, [navigate]);

    // Función para restablecer contraseña
    const resetPassword = useCallback(async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success('Se ha enviado un correo para restablecer tu contraseña');
        } catch (error: unknown) {
            let errorMessage = 'Error al enviar correo de restablecimiento';

            if (typeof error === 'object' && error !== null && 'code' in error) {
                const errorCode = (error as { code: string }).code;
                if (errorCode === 'auth/user-not-found') {
                    errorMessage = 'No existe una cuenta con este email.';
                } else if (errorCode === 'auth/invalid-email') {
                    errorMessage = 'El formato del email es inválido.';
                }
            }

            toast.error(errorMessage);
            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    // Función para actualizar el perfil del usuario
    const updateUserProfile = useCallback(async (name: string) => {
        try {
            if (!auth.currentUser) {
                throw new Error('No hay usuario autenticado');
            }

            await updateProfile(auth.currentUser, {
                displayName: name
            });

            // Actualizar también en Firestore
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
                name
            }, { merge: true });

            // Actualizar el estado local
            if (user) {
                setUser({
                    ...user,
                    name
                });
            }

            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar perfil');
            throw error;
        }
    }, [user]);

    // Función para verificar roles
    const hasRole = useCallback((roles: string | string[]) => {
        if (!user) {
            return false;
        }

        const userRole = user.role;

        if (typeof roles === 'string') {
            return userRole === roles;
        }

        return roles.includes(userRole);
    }, [user]);

    // Función para depurar problemas de autenticación (útil para solucionar errores de permisos)
    const debugAuthInfo = useCallback(() => {
        if (!user) {
            return { authenticated: false };
        }

        const authClaims = localStorage.getItem('auth_claims');

        return {
            authenticated: true,
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            claims: authClaims ? JSON.parse(authClaims) : null,
            userState: user
        };
    }, [user]);

    // Función para verificar si el usuario tiene un permiso específico
    const hasPermission = useCallback((permission: string) => {
        if (!user || !user.permissions) return false;

        // Verificar si el permiso existe en el objeto de permisos
        return !!user.permissions[permission];
    }, [user]);

    // Función para iniciar sesión con Google
    const loginWithGoogle = useCallback(async (): Promise<UserCredential> => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const formattedUser = await formatUser(userCredential.user);
            
            // Actualizar explícitamente el estado de usuario y autenticación
            setUser(formattedUser);
            setIsAuthenticated(true);
            
            // Guardar explícitamente los claims en localStorage si no están ya
            if (formattedUser.claims && Object.keys(formattedUser.claims).length > 0) {
                localStorage.setItem('auth_claims', JSON.stringify(formattedUser.claims));
            }
            
            toast.success(`Bienvenido, ${formattedUser.name}`);
            
            // Agregar un pequeño retraso para asegurar que el estado se actualice completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            return userCredential;
        } catch (error: unknown) {
            let errorMessage = 'Ocurrió un error al iniciar sesión con Google';

            if (typeof error === 'object' && error !== null && 'code' in error) {
                const errorCode = (error as { code: string }).code;
                if (errorCode === 'auth/account-exists-with-different-credential') {
                    errorMessage = 'Esta cuenta ya existe con una credencial diferente.';
                } else if (errorCode === 'auth/invalid-credential') {
                    errorMessage = 'Credenciales inválidas. Por favor, verifica tu cuenta de Google.';
                } else if (errorCode === 'auth/operation-not-allowed') {
                    errorMessage = 'Esta operación no está permitida. Por favor, contacta al administrador.';
                } else if (errorCode === 'auth/user-disabled') {
                    errorMessage = 'Esta cuenta de Google ha sido deshabilitada. Por favor, contacta al administrador.';
                } else if (errorCode === 'auth/user-not-found') {
                    errorMessage = 'No se encontró ninguna cuenta con este correo electrónico.';
                }
            }

            toast.error(errorMessage);
            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [formatUser]);

    // Función para refrescar los claims
    const refreshAuthClaims = useCallback(async (): Promise<void> => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            // Forzar recarga del token
            const idTokenResult = await currentUser.getIdTokenResult(true);
            
            // Actualizar el localStorage
            localStorage.setItem('auth_claims', JSON.stringify(idTokenResult.claims));
            
            // Actualizar el estado
            setUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    claims: idTokenResult.claims as Record<string, unknown>
                };
            });
            
            // Actualizar la caché
            cacheService.set('auth_claims', idTokenResult.claims as Record<string, unknown>);
        } catch (error) {
            console.error('Error al refrescar claims:', error);
        }
    }, []);

    // Función para actualizar el nombre del usuario
    const updateDisplayName = useCallback(async (name: string): Promise<void> => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No user is signed in");

            await updateProfile(currentUser, { displayName: name });

            // Actualizar el estado y la caché
            setUser(prevUser => {
                if (!prevUser) return null;
                const updatedUser = { ...prevUser, name };
                cacheService.set('auth_user', updatedUser);
                return updatedUser;
            });
        } catch (error) {
            const errorMessage = getUserFriendlyErrorMessage(error);
            setAuthError(errorMessage);
            throw error;
        }
    }, []);

    // Función para limpiar errores
    const clearAuthError = useCallback((): void => {
        setAuthError(null);
    }, []);

    // Actualizar contraseña
    const updatePassword = useCallback(async (currentPassword, newPassword) => {
        const currentUser = auth.currentUser;
        
        if (!currentUser?.email || !currentUser) {
            toast.error('Error al actualizar la contraseña', {
                description: 'No estás autenticado. Por favor, inicia sesión nuevamente.'
            });
            throw new Error('Usuario no autenticado');
        }
        
        try {
            // Re-autenticar al usuario antes de cambiar la contraseña
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                currentPassword
            );
            
            await reauthenticateWithCredential(currentUser, credential);
            await firebaseUpdatePassword(currentUser, newPassword);
            
            toast.success('Contraseña actualizada', {
                description: 'Tu contraseña ha sido actualizada correctamente.'
            });
            
            return true;
        } catch {
            toast.error('Error al actualizar la contraseña', {
                description: 'La contraseña actual es incorrecta o ha ocurrido un error. Inténtalo nuevamente.'
            });
            throw new Error('Error al actualizar la contraseña');
        }
    }, []);

    // Creamos un objeto de valor del contexto para evitar recrearlo en cada render
    const contextValue = useMemo(() => ({
        user,
        login,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        isAuthenticated,
        isLoading,
        hasRole,
        hasPermission,
        debugAuthInfo,
        usingEmulators: isUsingEmulators,
        loginWithGoogle,
        authError,
        refreshAuthClaims,
        updateDisplayName,
        clearAuthError,
        updatePassword
    }), [user, login, register, logout, resetPassword, updateUserProfile, isAuthenticated, isLoading, hasRole, hasPermission, debugAuthInfo, loginWithGoogle, authError, refreshAuthClaims, updateDisplayName, clearAuthError, updatePassword]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider; 