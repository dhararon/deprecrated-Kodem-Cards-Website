import { CardDetails, CardSet } from './card';

/**
 * Tipos de colección para la aplicación Kodem Cards
 */

/**
 * Tipo para representar una carta con su cantidad en la colección
 */
export interface CardWithQuantity {
    mainCard: CardDetails & { quantity: number; inCollection: boolean };
}

// Interfaz para representar la carta en la colección del usuario
// Alineada con user_collection_schema.json
export interface UserCollectionCard {
    cardId: string;
    quantity: number;
    addedAt: Date;
    updatedAt: Date;
}

// Interfaz para la colección completa del usuario
// Alineada con user_collection_schema.json
export interface UserCollection {
    userId: string;
    setCardId?: string; // Opcional pero incluido en el esquema
    cards: UserCollectionCard[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Tipo para representar una colección por set
 */
export interface CollectionCardsBySet {
    [setName: string]: {
        setName: CardSet;
        cards: (CardDetails & {
            quantity: number;
            inCollection: boolean;
        })[];
    };
}

/**
 * Tipo para la colección procesada
 */
export interface ProcessedCollection {
    cards: CardWithQuantity[];
    cardsByRarity: { [key: string]: CardWithQuantity[] };
    cardsBySet: { [key: string]: CardWithQuantity[] };
    totalCards: number;
    totalUniqueCards: number;
}

/**
 * Tipo para las estadísticas de completado de un set
 */
export interface SetCompletionStats {
    totalCount: number;
    ownedCount: number;
    completionPercentage: number;
}

/**
 * Tipo para las estadísticas totales de la colección
 */
export interface CollectionStats {
    totalSets: number;
    totalCards: number;
    cardsOwned: number;
    completionPercentage: number;
    setStats: {
        [setName: string]: SetCompletionStats;
    };
} 