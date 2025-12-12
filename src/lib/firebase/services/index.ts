/**
 * Barrel file para servicios de Firebase
 * Exporta todos los servicios de manera centralizada
 */

// Exportaciones de funciones
export {
    uploadFile,
    getFileURL,
    deleteFile,
    generateUniquePath
} from './storageService';

export {
    getCardsByIds,
    getCardsByType,
    getCardById,
    getAllCards
} from './cardService';

export {
    getUserCollection,
    getUserCollectionBySet,
    updateCardQuantity
} from './collectionService';

export type {
    CollectionCardsBySet
} from './collectionService';

// Exportar todos los servicios desde este punto central
export * from './cardService';
export * from './collectionService';
export * from './storageService';
export * from './deckService';
export * from './analyticsService'; 