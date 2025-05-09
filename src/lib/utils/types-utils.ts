/**
 * Utilidades para trabajar con tipos sin modificar los archivos en src/types
 */
import { CardType, CardEnergy, CardRarity } from '@/types/card';

// Función para obtener un tipo de carta por defecto
export const getDefaultCardType = (): CardType => {
    // Usar ADENDEI como valor por defecto
    return CardType.ADENDEI;
};

// Función para obtener una energía de carta por defecto
export const getDefaultCardEnergy = (): CardEnergy => {
    // Usar PIRICA como valor por defecto
    return CardEnergy.PIRICA;
};

// Función para obtener una rareza de carta por defecto
export const getDefaultCardRarity = (): CardRarity => {
    // Usar COMUN como valor por defecto
    return CardRarity.COMUN;
};

// Función para convertir una propiedad desconocida a un tipo seguro
export function toSafeCardType(value: unknown): CardType {
    if (value && Object.values(CardType).includes(value as CardType)) {
        return value as CardType;
    }
    return getDefaultCardType();
}

export function toSafeCardEnergy(value: unknown): CardEnergy {
    if (value && Object.values(CardEnergy).includes(value as CardEnergy)) {
        return value as CardEnergy;
    }
    return getDefaultCardEnergy();
}

export function toSafeCardRarity(value: unknown): CardRarity {
    if (value && Object.values(CardRarity).includes(value as CardRarity)) {
        return value as CardRarity;
    }
    return getDefaultCardRarity();
}

// Alias de tipo para compatibilidad
export type CardElement = CardEnergy;

// Tipo para transformar cualquier objeto en una tarjeta válida
export function asValidCard<T extends object>(card: T, defaults: Partial<T> = {}): T {
    return {
        ...defaults,
        ...card
    };
} 