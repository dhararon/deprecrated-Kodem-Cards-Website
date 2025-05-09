import { CardDetails } from './card';

/**
 * Tipos para la funcionalidad de listas de deseos
 */

/**
 * Representa una lista de deseos
 */
export interface WishList {
    id: string;
    userId: string;
    name: string;
    description?: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    imageUrl?: string;
    cardCount: number;
    cards: WishListCard[];
}

/**
 * Representa una carta en una lista de deseos
 */
export interface WishListCard {
    cardId: string;
    addedAt: Date;
    notes?: string;
    priority: WishListPriority;
}

/**
 * Prioridad de una carta en la lista de deseos
 */
export enum WishListPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

/**
 * Carta con datos adicionales para visualización en la lista de deseos
 */
export interface EnrichedWishListCard {
    wishlistData: WishListCard;
    cardDetails: CardDetails;
}

/**
 * Tipo para operaciones de agregar cartas a lista de deseos
 */
export interface AddToWishListRequest {
    wishlistId: string;
    cardId: string;
    priority?: WishListPriority;
    notes?: string;
} 