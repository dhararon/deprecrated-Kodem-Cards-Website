import { createContext } from 'react';
import { WishList, WishListCard, EnrichedWishListCard, AddToWishListRequest } from '@/types/wishlist';

/**
 * Tipo para el contexto de WishList
 */
export interface WishlistContextType {
    // Datos
    userWishlists: WishList[];
    selectedWishlist: WishList | null;
    enrichedCards: Record<string, EnrichedWishListCard[]>;
    
    // Estados
    loading: boolean;
    error: string | null;
    
    // Funciones para listas
    createWishlist: (name: string, description?: string, isPublic?: boolean) => Promise<string>;
    updateWishlist: (id: string, data: Partial<WishList>) => Promise<void>;
    deleteWishlist: (id: string) => Promise<void>;
    selectWishlist: (id: string) => Promise<void>;
    
    // Funciones para cartas
    addCardToWishlist: (request: AddToWishListRequest) => Promise<void>;
    removeCardFromWishlist: (wishlistId: string, cardId: string) => Promise<void>;
    updateCardInWishlist: (wishlistId: string, cardId: string, data: Partial<WishListCard>) => Promise<void>;
    isCardInWishlists: (cardId: string) => { inWishlist: boolean, wishlists: string[] };
    getEnrichedCards: (wishlistId: string) => Promise<EnrichedWishListCard[]>;
    
    // Otras funciones
    refreshWishlists: () => Promise<void>;
}

/**
 * Contexto para la gestión de listas de deseos
 */
export const WishlistContext = createContext<WishlistContextType | undefined>(undefined); 