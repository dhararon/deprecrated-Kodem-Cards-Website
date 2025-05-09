import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cacheService } from '@/lib/cache-service';
import { logError } from '@/lib/error-handler';
import { CardDetails, CardSet } from '@/types/card';
import { UserCollection, UserCollectionCard } from '@/types/collection';

// Nombre de la colección en Firestore
const COLLECTION_NAME = 'user_collections';

// TTL para la caché
const CACHE_TTL = {
    USER_COLLECTION: 5 * 60 * 1000, // 5 minutos
};

// Interfaz para agrupar cartas por set en la colección
export interface CollectionCardsBySet {
    [setName: string]: {
        setName: CardSet;
        cards: (CardDetails & { inCollection: boolean; quantity: number })[];
    };
}

/**
 * Obtiene la colección de cartas del usuario
 * @param userId - ID del usuario
 * @returns Colección de cartas del usuario
 */
export const getUserCollection = async (userId: string): Promise<UserCollection | null> => {
    const cacheKey = `userCollection:${userId}`;

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            const collectionRef = doc(db, COLLECTION_NAME, userId);
            const collectionSnap = await getDoc(collectionRef);

            if (!collectionSnap.exists()) {
                return null;
            }

            const data = collectionSnap.data();

            // Convertir a la estructura esperada
            const userCollection: UserCollection = {
                userId: userId,
                setCardId: data.setCardId,
                cards: Array.isArray(data.cards) ? data.cards : [],
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            };

            // Si el campo cards es un objeto (versión anterior), convertirlo a array
            if (!Array.isArray(data.cards) && typeof data.cards === 'object') {
                userCollection.cards = Object.entries(data.cards).map(([cardId, cardData]: [string, unknown]) => ({
                    cardId,
                    quantity: (cardData as { quantity?: number })?.quantity || 0,
                    addedAt: (cardData as { addedAt?: { toDate(): Date } })?.addedAt?.toDate() || new Date(),
                    updatedAt: (cardData as { updatedAt?: { toDate(): Date } })?.updatedAt?.toDate() || new Date()
                }));
            }

            console.log(`🔢 Colección cargada: ${userCollection.cards.length} tarjetas para el usuario ${userId}`);
            return userCollection;
        } catch (error) {
            console.error('Error al obtener la colección del usuario:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL.USER_COLLECTION);
};

/**
 * Obtiene todas las cartas por set con información de si están en la colección del usuario
 * @param userId - ID del usuario
 * @returns Cartas agrupadas por set con información de colección
 */
export const getUserCollectionBySet = async (userId: string): Promise<CollectionCardsBySet> => {
    try {
        // Obtener todas las cartas
        const cardsCol = collection(db, 'cards');
        const cardsSnapshot = await getDocs(cardsCol);

        console.log(`🔍 DEBUG: Se encontraron ${cardsSnapshot.docs.length} cartas en total en Firestore`);

        // Obtener la colección del usuario
        const userCollection = await getUserCollection(userId);

        // Crear un mapa de tarjetas de la colección para acceso rápido
        const userCardMap = new Map<string, UserCollectionCard>();
        if (userCollection && userCollection.cards) {
            userCollection.cards.forEach(card => {
                userCardMap.set(card.cardId, card);
                // También almacenar sin el prefijo para compatibilidad
                if (card.cardId.includes('/')) {
                    const simplifiedId = card.cardId.split('/').pop() || '';
                    if (simplifiedId) {
                        userCardMap.set(simplifiedId, card);
                    }
                }
            });
            console.log(`📊 Mapa de tarjetas del usuario: ${userCardMap.size} entradas`);
        }

        // Crear un mapa de cartas por set usando los valores del enum CardSet
        const cardsBySet: CollectionCardsBySet = {};

        // Inicializar todos los sets del enum para asegurar que están presentes aunque no tengan cartas
        Object.values(CardSet).forEach(setName => {
            cardsBySet[setName] = {
                setName: setName as CardSet,
                cards: []
            };
        });

        // Procesar todas las cartas
        cardsSnapshot.docs.forEach(doc => {
            const cardData = doc.data();
            const card = { ...cardData } as CardDetails;
            card.id = doc.id;

            // Asignar fullId si no existe
            if (!card.fullId) {
                card.fullId = card.id;
            }

            // Normalizar el nombre del set
            let setName = cardData.setName || cardData.cardSet;

            if (!setName) {
                console.warn(`⚠️ Carta ${doc.id} (${card.name}) sin setName, usando "promos" por defecto`);
                setName = CardSet.PROMOS;
            }

            // Normalizar y buscar coincidencia con el enum CardSet
            const normalizedSetName = typeof setName === 'string' ? setName.toLowerCase().trim() : '';
            const matchingEnumValue = Object.values(CardSet).find(
                enumValue => enumValue.toLowerCase() === normalizedSetName
            );

            // Usar el valor del enum si hay coincidencia, o el original si no
            const setNameToUse = matchingEnumValue || setName as CardSet;

            // Asegurarse de que la propiedad cardSet esté correctamente establecida
            card.cardSet = setNameToUse;

            // Asegurarse de que existe una entrada para este set
            if (!cardsBySet[setNameToUse]) {
                cardsBySet[setNameToUse] = {
                    setName: setNameToUse as CardSet,
                    cards: []
                };
            }

            // Verificar si la carta está en la colección del usuario
            // Probar con diferentes variantes del ID para encontrar la carta
            const possibleIds = [
                card.id,
                card.fullId,
                `cards/${card.id}`,
                card.id.includes('/') ? card.id.split('/').pop() || '' : ''
            ].filter(Boolean);

            let userCard: UserCollectionCard | undefined;
            for (const possibleId of possibleIds) {
                userCard = userCardMap.get(possibleId);
                if (userCard) break;
            }

            const inCollection = !!userCard;
            const quantity = userCard?.quantity || 0;

            if (inCollection) {
                console.log(`✅ Carta encontrada en colección: ${card.name} (ID: ${card.id}, Cantidad: ${quantity})`);
            }

            // Añadir la carta al set correspondiente
            cardsBySet[setNameToUse].cards.push({
                ...card,
                inCollection,
                quantity
            });
        });

        // Mostrar resumen de conjuntos encontrados
        console.log('📊 RESUMEN DE SETS ENCONTRADOS:');
        Object.entries(cardsBySet).forEach(([setName, setData]) => {
            const collectedCards = setData.cards.filter(c => c.inCollection).length;
            console.log(`   - ${setName}: ${setData.cards.length} cartas (${collectedCards} coleccionadas)`);
        });

        return cardsBySet;
    } catch (error) {
        console.error('Error al obtener las cartas por set:', error);
        logError(error);
        throw error;
    }
};

/**
 * Actualiza la cantidad de una carta en la colección del usuario
 * @param userId - ID del usuario
 * @param cardId - ID de la carta
 * @param quantity - Nueva cantidad (0 para eliminar de la colección)
 */
export const updateCardQuantity = async (
    userId: string,
    cardId: string,
    quantity: number
): Promise<void> => {
    try {
        console.log(`📊 Firebase - updateCardQuantity:
            Usuario: ${userId}
            Carta ID: ${cardId}
            Nueva cantidad: ${quantity}
        `);

        const collectionRef = doc(db, COLLECTION_NAME, userId);
        const collectionSnap = await getDoc(collectionRef);
        const now = new Date();

        if (!collectionSnap.exists()) {
            // Si no existe la colección, crearla
            console.log(`🆕 Creando nueva colección para usuario ${userId}`);

            if (quantity > 0) {
                const newUserCard: UserCollectionCard = {
                    cardId,
                    quantity,
                    addedAt: now,
                    updatedAt: now
                };

                await setDoc(collectionRef, {
                    userId,
                    cards: [newUserCard],
                    createdAt: now,
                    updatedAt: now
                });
                console.log(`✅ Colección creada con la carta ${cardId}`);
            }
        } else {
            const data = collectionSnap.data();
            let cards: UserCollectionCard[] = [];

            // Convertir de objeto a array si es necesario (para compatibilidad)
            if (Array.isArray(data.cards)) {
                cards = data.cards;
            } else if (typeof data.cards === 'object') {
                // Convertir de la estructura antigua (objeto) a la nueva (array)
                cards = Object.entries(data.cards).map(([id, cardData]: [string, unknown]) => ({
                    cardId: id,
                    quantity: (cardData as { quantity?: number })?.quantity || 0,
                    addedAt: (cardData as { addedAt?: { toDate(): Date } })?.addedAt?.toDate() || now,
                    updatedAt: (cardData as { updatedAt?: { toDate(): Date } })?.updatedAt?.toDate() || now
                }));
            }

            // Encontrar si la carta ya existe en la colección
            const existingCardIndex = cards.findIndex(c => {
                // Comparar directamente
                if (c.cardId === cardId) return true;

                // Comparar sin prefijo path
                if (cardId.includes('/') && c.cardId === cardId.split('/').pop()) return true;
                if (c.cardId.includes('/') && c.cardId.split('/').pop() === cardId) return true;

                return false;
            });

            if (quantity <= 0) {
                // Si la cantidad es 0, eliminar la carta de la colección
                if (existingCardIndex !== -1) {
                    cards.splice(existingCardIndex, 1);
                }
                console.log(`🗑️ Carta ${cardId} eliminada de la colección`);
            } else {
                if (existingCardIndex !== -1) {
                    // Actualizar carta existente
                    cards[existingCardIndex] = {
                        ...cards[existingCardIndex],
                        quantity,
                        updatedAt: now
                    };
                } else {
                    // Añadir nueva carta
                    cards.push({
                        cardId,
                        quantity,
                        addedAt: now,
                        updatedAt: now
                    });
                }
                console.log(`📝 Carta ${cardId} actualizada a cantidad ${quantity}`);
            }

            // Actualizar la colección completa
            await updateDoc(collectionRef, {
                cards,
                updatedAt: now
            });
        }

        // Invalidar la caché
        const cacheKey = `userCollection:${userId}`;
        cacheService.delete(cacheKey);
        console.log(`🧹 Caché invalidada para usuario ${userId}`);
    } catch (error) {
        console.error('❌ Error al actualizar la cantidad de la carta:', error);
        logError(error);
        throw error;
    }
}; 