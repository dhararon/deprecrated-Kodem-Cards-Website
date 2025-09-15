import { useContext } from 'react';
import { UserDataContext, UserDataContextType } from '@/context/userData/UserDataContext';

/**
 * Hook para acceder al contexto de datos de usuario
 * @returns El contexto de datos de usuario
 */
export const useUserData = (): UserDataContextType => {
    const context = useContext(UserDataContext);
    if (context === undefined) {
        throw new Error('useUserData debe ser usado dentro de un UserDataProvider');
    }
    return context;
};

export default useUserData; 