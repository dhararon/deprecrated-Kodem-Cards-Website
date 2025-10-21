import { Card, CardType, Prices, CardSet } from '@/types/card';
import { toSafeCardType, toSafeCardRarity, toSafeCardEnergy } from './types-utils';

/**
 * Transforma una carta a formato base
 */
export function catalogCardToBaseCard(card: Record<string, unknown>): Card {
    const cardType = toSafeCardType(card.cardType as string || card.type as string);
    const cardEnergy = toSafeCardEnergy(card.cardEnergy as string || card.energy as string);
    
    return {
        id: card.id as string,
        name: card.name as string,
        cardType: cardType,
        cardEnergy: cardEnergy,
        rarity: toSafeCardRarity(card.rarity as string),
        imageUrl: card.imageUrl as string,
        cardNumber: card.cardNumber as number,
        cardSet: (card.cardSet as string || card.set as string) as CardSet,
        fullId: card.fullId as string || card.id as string,
        prices: card.prices as Prices || {
            high: 0,
            market: 0,
            low: 0
        },
        // Campos legacy para compatibilidad
        type: cardType,
        energy: cardEnergy
    };
}

/**
 * Transforma una carta base a formato de catálogo
 */
export function baseCardToCatalogCard(card: Card): Card {
    return {
        ...card
    };
}

/**
 * Transforma una carta para el formato de deck
 */
export function transformCardForDeck(card: Record<string, unknown>): Card {
    if ((card as Record<string, unknown>).tcgType) {
        return catalogCardToBaseCard(card);
    }
    // Aseguramos que el objeto tenga la estructura mínima requerida de una Card
    return catalogCardToBaseCard(card);
}

/**
 * Obtiene el tipo de carta
 * @param card Carta a analizar
 * @returns Tipo de la carta
 */
export function getCardType(card: Card): CardType {
    return toSafeCardType(card.cardType || card.type);
}

/**
 * Obtiene el elemento de energía de la carta
 * @param card Carta a analizar
 * @returns Energía de la carta
 */
export function getCardElement(card: Card): string {
    return card.cardEnergy || card.energy || 'neutral';
}

/**
 * Transforma una carta en un formato compatible con la aplicación
 * @param card Carta de origen
 * @returns Carta transformada
 */
export function transformCard(card: Record<string, unknown>): Card {
    const safeType = toSafeCardType((card.type || card.cardType) as string);
    const safeEnergy = toSafeCardEnergy((card.energy || card.cardEnergy) as string);
    
    const prices = card.prices as Prices || {
        high: 0,
        market: 0,
        low: 0
    };
    
    return {
        id: card.id as string,
        name: (card.name as string) || 'Carta sin nombre',
        imageUrl: (card.imageUrl as string) || '',
        cardType: safeType,
        cardEnergy: safeEnergy,
        rarity: toSafeCardRarity(card.rarity as string),
        cardSet: (card.cardSet as string) as CardSet,
        cardNumber: (card.cardNumber as number) || 0,
        prices: prices,
        // Campos legacy para compatibilidad
        type: safeType,
        energy: safeEnergy
    };
}

/**
 * Obtiene el elemento de la carta desde cualquier objeto
 * @param card Objeto de carta
 * @returns Elemento de la carta
 */
export function getCardElementFromAny(card: Record<string, unknown>): string {
    return (card.cardEnergy as string) || (card.energy as string) || 'desconocido';
} 