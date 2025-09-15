import { useContext } from 'react';
import { WishlistContext, WishlistContextType } from '@/context/wishlist/WishlistContext';

/**
 * Hook para acceder al contexto de listas de deseos
 * @returns El contexto de listas de deseos
 */
export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist debe ser usado dentro de un WishlistProvider');
    }
    return context;
};

export default useWishlist; 