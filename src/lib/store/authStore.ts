import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

// Define tipos para roles y usuarios
export type UserRole = 'admin' | 'user' | 'staff';

export type Permission =
    | 'view:dashboard'
    | 'view:orders'
    | 'edit:orders'
    | 'grade:cards'
    | 'view:reports'
    | 'manage:users'
    | 'admin:system';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    permissions: Permission[];
    avatarUrl?: string;
    lastLogin?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    // Métodos
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (roles: UserRole | UserRole[]) => boolean;
    hasPermission: (permissions: Permission | Permission[]) => boolean;
    refreshSession: () => void;
}

// Usuarios estáticos para autenticación
const STATIC_USERS: Record<string, { password: string; user: User }> = {
    'admin@example.com': {
        password: 'admin123',
        user: {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            permissions: ['view:dashboard', 'view:orders', 'edit:orders', 'grade:cards', 'view:reports', 'manage:users', 'admin:system'],
            avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
        }
    },
    'user@example.com': {
        password: 'user123',
        user: {
            id: '2',
            email: 'user@example.com',
            name: 'Regular User',
            role: 'user',
            permissions: ['view:dashboard', 'view:orders'],
            avatarUrl: 'https://ui-avatars.com/api/?name=Regular+User&background=2AAF74&color=fff',
        }
    },
    'staff@example.com': {
        password: 'staff123',
        user: {
            id: '3',
            email: 'staff@example.com',
            name: 'Staff User',
            role: 'staff',
            permissions: ['view:dashboard', 'view:orders', 'edit:orders', 'grade:cards'],
            avatarUrl: 'https://ui-avatars.com/api/?name=Staff+User&background=D13438&color=fff',
        }
    }
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                try {
                    set({ isLoading: true, error: null });

                    // Simulamos una pequeña demora para simular una petición real
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const normalizedEmail = email.toLowerCase().trim();
                    const userCredentials = STATIC_USERS[normalizedEmail];

                    if (userCredentials && userCredentials.password === password) {
                        // Actualizar última fecha de login
                        const userData = {
                            ...userCredentials.user,
                            lastLogin: new Date().toISOString()
                        };

                        set({
                            user: userData,
                            isAuthenticated: true,
                            isLoading: false
                        });

                        // Mostrar toast después de una pequeña demora para evitar colisiones
                        setTimeout(() => {
                            toast.success(`Bienvenido, ${userData.name}`, {
                                description: `Has iniciado sesión como ${userData.role}`
                            });
                        }, 100);
                    } else {
                        set({ isLoading: false, error: 'Credenciales inválidas' });
                        toast.error('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
                        throw new Error('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
                    }
                } catch (error) {
                    set({ isLoading: false });
                    if (error instanceof Error) {
                        throw error;
                    }
                    throw new Error('Ocurrió un error al iniciar sesión');
                }
            },

            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                });
                // Mostrar toast con pequeña demora
                setTimeout(() => {
                    toast.info('Has cerrado sesión correctamente');
                }, 100);
            },

            hasRole: (roles) => {
                const { user } = get();
                if (!user) return false;

                if (typeof roles === 'string') {
                    return user.role === roles;
                }

                return roles.includes(user.role);
            },

            hasPermission: (permissions) => {
                const { user } = get();
                if (!user) return false;

                if (typeof permissions === 'string') {
                    return user.permissions.includes(permissions);
                }

                return permissions.every(p => user.permissions.includes(p));
            },

            refreshSession: () => {
                const { user } = get();
                if (user) {
                    set({
                        user: {
                            ...user,
                            lastLogin: new Date().toISOString()
                        }
                    });
                }
            }
        }),
        {
            name: 'pdtgrading-auth-storage',
            // Tiempo de expiración de la sesión (7 días)
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
); 