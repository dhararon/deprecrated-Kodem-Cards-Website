import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/auth/AuthContext';

/**
 * Hook para acceder al contexto de autenticación
 * @returns El contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export default useAuth; 