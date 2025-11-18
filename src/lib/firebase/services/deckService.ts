import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit as firestoreLimit,
    orderBy,
    serverTimestamp,
    Timestamp,
    increment as firestoreIncrement
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cacheService } from '@/lib/cache-service';
import { logError } from '@/lib/error-handler';
import { Deck, DeckFilters, DeckWithCards, DeckCardSlot } from '@/types/deck';
import { getCardsByIds } from './cardService';

// Nombre de la colección en Firestore
const COLLECTION_NAME = 'decks';

// TTL para la caché
const CACHE_TTL = {
    USER_DECKS: 5 * 60 * 1000, // 5 minutos
    DECK_DETAILS: 5 * 60 * 1000, // 5 minutos
    PUBLIC_DECKS: 10 * 60 * 1000, // 10 minutos
};

/**
 * Convierte un documento de Firestore en un objeto de mazo
 */
const convertDocToDeck = (docSnapshot: unknown): Deck => {
    if (!(docSnapshot as { exists: () => boolean }).exists()) {
        throw new Error('Document does not exist');
    }

    const data = (docSnapshot as { data: () => Record<string, unknown> }).data();

    // Convertir Timestamps a strings ISO
    let createdAt = data.createdAt;
    let updatedAt = data.updatedAt;

    if (createdAt instanceof Timestamp) {
        createdAt = createdAt.toDate().toISOString();
    }

    if (updatedAt instanceof Timestamp) {
        updatedAt = updatedAt.toDate().toISOString();
    }

    return {
        id: (docSnapshot as { id: string }).id,
        name: (data.name as string) || 'Mazo sin nombre',
        userUid: data.userUid as string,
        userName: data.userName as string,
        userAvatar: data.userAvatar as string,
        cardIds: (data.cardIds as string[]) || [],
        // Incluir deckSlots si existen (posiciones y estructura del mazo)
        deckSlots: (data.deckSlots as DeckCardSlot[]) || [],
        isPublic: (data.isPublic as boolean) || false,
        description: (data.description as string) || '',
        likes: (data.likes as number) || 0,
        views: (data.views as number) || 0,
        createdAt: createdAt as string,
        updatedAt: updatedAt as string
    };
};

/**
 * Guarda un nuevo mazo en Firestore
 */
export const createDeck = async (deckData: Omit<Deck, 'id'>): Promise<string> => {
    try {
        // Agregar timestamps
        const deckWithTimestamps = {
            ...deckData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const decksCol = collection(db, COLLECTION_NAME);
        const docRef = await addDoc(decksCol, deckWithTimestamps);

        // Invalidar caché de mazos del usuario
        cacheService.delete(`userDecks:${deckData.userUid}`);

        return docRef.id;
    } catch (error) {
        console.error('Error al crear el mazo:', error);
        logError(error);
        throw error;
    }
};

/**
 * Actualiza un mazo existente en Firestore
 */
export const updateDeck = async (deckId: string, deckData: Partial<Omit<Deck, 'id'>>): Promise<void> => {
    try {
        // No permitir actualizar userUid
        const { userUid: _userUid, ...updateData } = deckData;
        
        // Verificar que no estamos actualizando userUid
        console.log(`Actualizando mazo ${deckId}, userUid original ${_userUid} no será modificado`);

        // Agregar timestamp de actualización
        const dataToUpdate = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        const deckRef = doc(db, COLLECTION_NAME, deckId);
        await updateDoc(deckRef, dataToUpdate);

        // Obtener el userUid del mazo para invalidar caché
        const deckSnap = await getDoc(deckRef);
        if (deckSnap.exists()) {
            const uid = deckSnap.data().userUid;
            cacheService.delete(`userDecks:${uid}`);
        }

        // Invalidar caché del mazo específico
        cacheService.delete(`deck:${deckId}`);
    } catch (error) {
        console.error('Error al actualizar el mazo:', error);
        logError(error);
        throw error;
    }
};

/**
 * Elimina un mazo de Firestore
 */
export const deleteDeck = async (deckId: string): Promise<void> => {
    try {
        // Primero obtener el mazo para invalidar la caché después
        const deckRef = doc(db, COLLECTION_NAME, deckId);
        const deckSnap = await getDoc(deckRef);

        await deleteDoc(deckRef);

        // Si el mazo existe, invalidar cachés
        if (deckSnap.exists()) {
            const deckData = deckSnap.data();
            cacheService.delete(`userDecks:${deckData.userUid}`);
            cacheService.delete(`deck:${deckId}`);
        }
    } catch (error) {
        console.error('Error al eliminar el mazo:', error);
        logError(error);
        throw error;
    }
};

/**
 * Obtiene un mazo por su ID
 */
export const getDeckById = async (deckId: string, skipCache: boolean = false): Promise<Deck | null> => {
    const cacheKey = `deck:${deckId}`;

    // Si skipCache es true, siempre obtener datos frescos de Firestore
    if (skipCache) {
        try {
            const deckRef = doc(db, COLLECTION_NAME, deckId);
            const deckSnap = await getDoc(deckRef);

            if (deckSnap.exists()) {
                return convertDocToDeck(deckSnap);
            }

            return null;
        } catch (error) {
            console.error('Error al obtener el mazo:', error);
            logError(error);
            throw error;
        }
    }

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            const deckRef = doc(db, COLLECTION_NAME, deckId);
            const deckSnap = await getDoc(deckRef);

            if (deckSnap.exists()) {
                return convertDocToDeck(deckSnap);
            }

            return null;
        } catch (error) {
            console.error('Error al obtener el mazo:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL.DECK_DETAILS);
};

/**
 * Obtiene un mazo por su ID con los detalles completos de las cartas
 */
export const getDeckWithCards = async (deckId: string, skipCache: boolean = false): Promise<DeckWithCards | null> => {
    try {
        const deck = await getDeckById(deckId, skipCache);

        if (!deck) {
            return null;
        }

        // Obtener detalles de las cartas
        const cards = await getCardsByIds(deck.cardIds);

        return {
            ...deck,
            cards,
            cardIds: deck.cardIds
        };
    } catch (error) {
        console.error('Error al obtener el mazo con cartas:', error);
        logError(error);
        throw error;
    }
};

/**
 * Obtiene los mazos del usuario
 */
export const getUserDecks = async (userUid: string): Promise<Deck[]> => {
    if (!userUid) {
        console.error('Error: userUid es undefined en getUserDecks');
        return [];
    }
    
    const cacheKey = `userDecks:${userUid}`;

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            const decksCol = collection(db, COLLECTION_NAME);
            const decksQuery = query(
                decksCol,
                where("userUid", "==", userUid),
                orderBy("updatedAt", "desc")
            );

            const decksSnapshot = await getDocs(decksQuery);
            const decks = decksSnapshot.docs.map(convertDocToDeck);

            return decks;
        } catch (error) {
            console.error('Error al obtener los mazos del usuario:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL.USER_DECKS);
};

/**
 * Busca mazos usando filtros
 */
export const queryDecks = async (filters: DeckFilters): Promise<Deck[]> => {
    try {
        const decksCol = collection(db, COLLECTION_NAME);
        const constraints = [];

        // Filtrar por usuario si se especifica
        if (filters.userUid) {
            constraints.push(where("userUid", "==", filters.userUid));
        }

        // Filtrar por visibilidad pública
        if (filters.isPublic !== undefined) {
            constraints.push(where("isPublic", "==", filters.isPublic));
        }

        // Ordenar por fecha de actualización descendente
        constraints.push(orderBy("updatedAt", "desc"));

        // Limitar resultados si se especifica
        if (filters.limit) {
            constraints.push(firestoreLimit(filters.limit));
        }

        const decksQuery = query(decksCol, ...constraints);
        const decksSnapshot = await getDocs(decksQuery);

        let decks = decksSnapshot.docs.map(convertDocToDeck);

        // Filtrar por término de búsqueda si se especifica
        // Esto se hace client-side porque Firestore no permite búsquedas de texto completo
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            decks = decks.filter(deck =>
                deck.name.toLowerCase().includes(searchTerm) ||
                (deck.description && deck.description.toLowerCase().includes(searchTerm))
            );
        }

        return decks;
    } catch (error) {
        console.error('Error al buscar mazos:', error);
        logError(error);
        throw error;
    }
};

/**
 * Obtiene los mazos públicos, opcionalmente filtrados
 */
export const getPublicDecks = async (limit: number = 20): Promise<Deck[]> => {
    const cacheKey = `publicDecks:limit=${limit}`;

    return cacheService.getOrFetch(cacheKey, async () => {
        return queryDecks({
            isPublic: true,
            limit
        });
    }, CACHE_TTL.PUBLIC_DECKS);
};

/**
 * Incrementa el contador de vistas de un mazo
 */
export const incrementDeckViews = async (deckId: string): Promise<void> => {
    try {
        const deckRef = doc(db, COLLECTION_NAME, deckId);

        // Incrementar contador de vistas
        await updateDoc(deckRef, {
            views: firestoreIncrement(1),
            updatedAt: serverTimestamp()
        });

        // Invalidar caché del mazo
        cacheService.delete(`deck:${deckId}`);
    } catch (error) {
        console.error('Error al incrementar vistas del mazo:', error);
        logError(error);
        // No lanzar error para que no afecte la experiencia del usuario
    }
};

/**
 * Agrega o quita un like a un mazo
 */
export const toggleDeckLike = async (deckId: string, liked: boolean): Promise<void> => {
    try {
        const deckRef = doc(db, COLLECTION_NAME, deckId);

        // Incrementar o decrementar likes
        await updateDoc(deckRef, {
            likes: firestoreIncrement(liked ? 1 : -1),
            updatedAt: serverTimestamp()
        });

        // Invalidar caché del mazo
        cacheService.delete(`deck:${deckId}`);
    } catch (error) {
        console.error('Error al actualizar likes del mazo:', error);
        logError(error);
        throw error;
    }
};

/**
 * Verifica si ya existe un mazo con el mismo nombre para un usuario
 * @param userUid ID del usuario
 * @param deckName Nombre del mazo a verificar
 * @param excludeDeckId ID opcional del mazo a excluir de la verificación (útil al actualizar)
 * @returns Object con {exists: boolean, deckId?: string}
 */
export const checkDeckNameExists = async (
    userUid: string,
    deckName: string,
    excludeDeckId?: string
): Promise<{ exists: boolean, deckId?: string }> => {
    try {
        const decksCol = collection(db, COLLECTION_NAME);
        const decksQuery = query(
            decksCol,
            where("userUid", "==", userUid),
            where("name", "==", deckName)
        );

        const decksSnapshot = await getDocs(decksQuery);

        if (decksSnapshot.empty) {
            return { exists: false };
        }

        // Si hay resultados, verificar que no sea el mazo que estamos excluyendo
        const existingDeck = decksSnapshot.docs[0];
        const deckId = existingDeck.id;

        // Si estamos excluyendo este mazo (caso de actualización), entonces no existe duplicado
        if (excludeDeckId && deckId === excludeDeckId) {
            return { exists: false };
        }

        return { exists: true, deckId };
    } catch (error) {
        console.error('Error al verificar nombre de mazo:', error);
        logError(error);
        // En caso de error, asumimos que no existe para evitar bloquear al usuario
        return { exists: false };
    }
};

/**
 * Obtiene todos los mazos públicos ordenados por fecha de creación
 * @returns Array de mazos públicos
 */
export const getAllPublicDecks = async (): Promise<Deck[]> => {
    try {
        const decksRef = collection(db, 'decks');
        const q = query(
            decksRef,
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            firestoreLimit(50) // Limitamos a 50 mazos para no sobrecargar
        );
        
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                userUid: data.userUid,
                userName: data.userName,
                userAvatar: data.userAvatar,
                cardIds: data.cardIds || [],
                isPublic: data.isPublic,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                likes: data.likes || 0
            };
        });
    } catch (error) {
        console.error("Error getting public decks", error);
        throw error;
    }
}; 