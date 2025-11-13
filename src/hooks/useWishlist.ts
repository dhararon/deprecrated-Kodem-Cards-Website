import { useContext } from 'react';
import { WishlistContext } from '@/context/wishlist/WishlistContext';

/**
 * Hook para acceder al contexto de listas de deseos.
 * Si el provider fue removido, devolvemos una implementación segura (no hace llamadas).
 */
export const useWishlist = () => {
    const context = useContext(WishlistContext as any);
    if (!context) {
        // Retornamos un objeto seguro con funciones no-op para que los componentes no fallen
        return {
            userWishlists: [],
            selectedWishlist: null,
            enrichedCards: {},
            loading: false,
            error: null,
            createWishlist: async () => { throw new Error('Wishlist feature removed'); },
            updateWishlist: async () => {},
            deleteWishlist: async () => {},
            selectWishlist: async () => {},
            addCardToWishlist: async () => {},
            removeCardFromWishlist: async () => {},
            updateCardInWishlist: async () => {},
            isCardInWishlists: () => ({ inWishlist: false, wishlists: [] }),
            getEnrichedCards: async () => [] as any,
            refreshWishlists: async () => {}
        } as any;
    }
    return context;
};

export default useWishlist;