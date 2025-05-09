import { createContext } from 'react';
import { ProcessedCollection } from '@/types/collection';

// Definición de tipos para el contexto de colección
export interface CollectionContextType {
    userCollection: ProcessedCollection;
    loading: boolean;
    error: string | null;
    refreshCollection: () => Promise<void>;
    isCardInCollection: (cardId: string) => boolean;
    getCardQuantity: (cardId: string) => number;
    updateCardQuantity: (cardId: string, quantity: number) => void;
}

// Exportamos el contexto
export const CollectionContext = createContext<CollectionContextType | undefined>(undefined); 