import { CardDetails } from './card';

/**
 * Estados posibles de un mazo
 */
export type DeckStatus = 'public' | 'private' | 'draft';

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
    status: DeckStatus; // Estado del mazo: public, private o draft
    description?: string; // Descripción opcional del mazo
    likes?: number; // Número de likes que ha recibido el mazo
    views?: number; // Número de veces que se ha visto el mazo
    createdAt?: string; // Fecha de creación en formato ISO
    updatedAt?: string; // Fecha de última actualización en formato ISO
    deckSlots?: DeckCardSlot[]; // slots con posición
    // Legacy support
    isPublic?: boolean; // Deprecated: use status instead
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
    status?: DeckStatus; // Buscar por estado
    isPublic?: boolean; // Deprecated: use status instead
    searchTerm?: string;
    limit?: number;
}

export type DeckCardSlot = {
    cardId: string;
    row: number;
    col: number;
}; 