import { useContext } from 'react';
import { CollectionContext, CollectionContextType } from '@/context/collection/CollectionContext';

/**
 * Hook para acceder al contexto de colección
 * @returns El contexto de colección
 */
export const useCollection = (): CollectionContextType => {
    const context = useContext(CollectionContext);
    if (context === undefined) {
        throw new Error('useCollection debe ser usado dentro de un CollectionProvider');
    }
    return context;
};

export default useCollection; 