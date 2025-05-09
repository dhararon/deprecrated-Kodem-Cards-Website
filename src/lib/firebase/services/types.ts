/**
 * Tipos para compatibilidad con los servicios de Firebase
 */

import { Card } from '@/types/card';

// Tipos para el servicio de colección
export interface UserCollection {
    [setName: string]: {
        setName: string;
        cards: UserCollectionCard[];
    };
}

/**
 * Propiedades adicionales que pueden existir en una carta de colección de usuario
 */
export type CardAdditionalProperties = {
    // Propiedades específicas conocidas
    notes?: string;
    condition?: string;
    purchasePrice?: number;
    purchaseDate?: string | Date;
    isFoil?: boolean;
    isPromo?: boolean;
    isAlternateArt?: boolean;
    source?: string;
    // Para otras propiedades dinámicas
    [key: string]: unknown;
};

export interface UserCollectionCard extends CardAdditionalProperties {
    id: string;
    quantity: number;
    inCollection: boolean;
    fullId?: string;
}

export interface CardWithExtraFields extends Card, CardAdditionalProperties {}

// Tipos para elementos que pueden ser agregados a una carta en un mazo
export type DeckCardElement = {
    type: string;
    id: string;
    position?: { x: number; y: number };
    scale?: number;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
    visible?: boolean;
};

// Tipo para el servicio de mazos
export interface DeckCardWithElement extends Card {
    element?: DeckCardElement;
    thumbnailUrl?: string;
    setname?: string;
    // Para otras propiedades dinámicas
    [key: string]: unknown;
} 