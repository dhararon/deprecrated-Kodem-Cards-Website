import React from "react";
import { WishlistContext } from "./WishlistContext";

interface WishlistProviderProps {
    children: React.ReactNode;
}

/**
 * Proveedor para el contexto de listas de deseos (REMOVIDO)
 * Este provider ya no hace nada; el feature de wishlists ha sido eliminado.
 * Se mantiene por compatibilidad con el hook useWishlist que devuelve un no-op.
 */
export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
    // No-op context: no carga datos, solo pasa children
    const contextValue = {
        userWishlists: [],
        selectedWishlist: null,
        enrichedCards: {},
        loading: false,
        error: null,
        createWishlist: async () => { throw new Error("Wishlist feature removed"); },
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

    return (
        <WishlistContext.Provider value={contextValue}>
            {children}
        </WishlistContext.Provider>
    );
};
