import { CardDetails } from './card';

/**
 * Interfaz para el modelo de datos de un mazo en Firestore
 */
export interface Deck {
    id?: string;
    name: string;
    userUid: string;
    userName?: string; // Nombre del usuario para mostrar
    userAvatar?: string; // Avatar del usuario
    cardIds: string[]; // IDs de las cartas en el mazo
    isPublic: boolean; // Si el mazo es público o privado
    description?: string; // Descripción opcional del mazo
    likes?: number; // Número de likes que ha recibido el mazo
    views?: number; // Número de veces que se ha visto el mazo
    createdAt?: string; // Fecha de creación en formato ISO
    updatedAt?: string; // Fecha de última actualización en formato ISO
    deckSlots?: DeckCardSlot[]; // Nuevo: slots con posición
}

/**
 * Interfaz para el mazo con los detalles completos de las cartas
 */
export interface DeckWithCards extends Omit<Deck, 'cardIds'> {
    cards: CardDetails[];
    cardIds: string[];
    deckSlots?: DeckCardSlot[];
}

/**
 * Interfaz para los filtros de búsqueda de mazos
 */
export interface DeckFilters {
    userUid?: string;
    isPublic?: boolean;
    searchTerm?: string;
    limit?: number;
}

export type DeckCardSlot = {
    cardId: string;
    row: number;
    col: number;
}; 