import { createContext } from 'react';
import { UserCredential } from 'firebase/auth';

// Definición de tipos de usuario con roles
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'staff';
    avatarUrl?: string;
    claims?: Record<string, unknown>;
    permissions?: Record<string, unknown>;
}

// Tipo del contexto de autenticación
export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<UserCredential>;
    register: (email: string, password: string, name: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (name: string) => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasRole: (roles: string | string[]) => boolean;
    hasPermission: (permission: string) => boolean;
    debugAuthInfo: () => {
        authenticated: boolean;
        userId?: string;
        userEmail?: string;
        userRole?: string;
        claims?: unknown;
        userState?: User | null;
    };
    usingEmulators: boolean;
    loginWithGoogle: () => Promise<UserCredential>;
    authError: string | null;
    refreshAuthClaims: () => Promise<void>;
    updateDisplayName: (name: string) => Promise<void>;
    clearAuthError: () => void;
}

// Exportamos el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined); 