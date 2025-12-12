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
    limit,
    startAfter,
    DocumentSnapshot,
    orderBy,
    getCountFromServer,
    QueryConstraint,
    Timestamp
} from 'firebase/firestore';
import { db, isUsingEmulators } from '@/lib/firebase';
import { cacheService } from '@/lib/cache-service';
import { optimizePayload } from '@/lib/payload-optimizer';
import { logError } from '@/lib/error-handler';
import { Card, CardDetails, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { toast } from 'sonner';

// Nombre de la colección en Firestore
const COLLECTION_NAME = 'cards';

// TTL para la caché
const CACHE_TTL = {
    ALL_CARDS: 10 * 60 * 1000, // 10 minutos
    CARD_DETAILS: 15 * 60 * 1000, // 15 minutos
    FILTERED_CARDS: 5 * 60 * 1000, // 5 minutos
    CARD_SEARCH: 5 * 60 * 1000, // 5 minutos
};

// Claves a excluir del payload para optimizar tamaño
const PAYLOAD_EXCLUDE_KEYS = ['description', 'rules'];

// Interfaz para resultados paginados
export interface PaginatedCards {
    cards: CardDetails[];
    lastVisible: DocumentSnapshot | null;
    totalCards: number;
}

// Tipo para el documento de Firebase
interface FirestoreCardDocument {
    name: string;
    cardType?: CardType;
    type?: CardType;
    cardEnergy?: CardEnergy;
    energy?: CardEnergy;
    rarity?: CardRarity;
    setName?: string;
    cardSet?: string;
    imageUrl?: string;
    cardNumber?: number;
    fullId?: string;
    power?: number;
    sleep?: number;
    description?: string;
    rules?: string[];
    standardLegal?: boolean;
    languages?: string[];
    artists?: string[];
    prices?: {
        high: number;
        market: number;
        low: number;
    };
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    [key: string]: unknown;
}

/**
 * Convierte un documento de Firestore en un objeto de detalles de carta, 
 * adaptado a firebase_cards_schema.json y src/types/card.ts
 */
export const convertDocToCardDetails = (docSnapshot: DocumentSnapshot): CardDetails => {
    if (!docSnapshot.exists()) {
        throw new Error('Document does not exist');
    }
    const data = docSnapshot.data() as FirestoreCardDocument;

    // Mapeo usando nombres de src/types/card.ts (izquierda)
    // y leyendo desde Firestore usando nombres de firebase_cards_schema.json (derecha)

    // Normalizar el setName para asegurarse de que coincide con CardSet enum
    let setNameValue = data.setName || data.cardSet;

    // Si no hay un valor de setName, usar un valor predeterminado
    if (!setNameValue) {
        console.warn(`⚠️ Carta ${docSnapshot.id} no tiene setName o cardSet definido, usando "promos" por defecto`);
        setNameValue = CardSet.PROMOS;
    }

    // Normalizar el nombre del set para buscar coincidencias con el enum
    const normalizedSetName = typeof setNameValue === 'string' ? setNameValue.toLowerCase().trim() : '';

    // Encontrar una coincidencia en el enum CardSet
    const matchingEnumValue = Object.values(CardSet).find(
        enumValue => enumValue.toLowerCase() === normalizedSetName
    );

    // Usar el valor del enum si hay coincidencia, de lo contrario usar el valor original
    const cardSetValue = matchingEnumValue || setNameValue as CardSet;

    const card: CardDetails = {
        id: docSnapshot.id,
        name: data.name || '',
        // NO incluir name_lowercase
        cardType: data.cardType as CardType || CardType.ADENDEI, // Usar nombre de campo estandarizado
        cardEnergy: data.cardEnergy as CardEnergy || CardEnergy.PIRICA, // Usar nombre de campo estandarizado
        rarity: data.rarity as CardRarity || CardRarity.COMUN,
        cardSet: cardSetValue, // Usar el valor normalizado
        imageUrl: data.imageUrl || '',
        cardNumber: data.cardNumber || 0,
        fullId: data.fullId || '',
        power: data.power ?? undefined,
        sleep: data.sleep ?? undefined,
        description: data.description || '',
        rules: data.rules || [],
        standardLegal: data.standardLegal ?? false,
        languages: data.languages || undefined, // Asumiendo que existe en schema si es necesario
        artist: data.artists || [], // Lee artists
        prices: data.prices || { high: 0, market: 0, low: 0 },
        
        // Campos de auditoría - manejar diferentes formatos de fecha con seguridad
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        
        // Para compatibilidad con código existente - Estos campos serán deprecados
        type: data.cardType as CardType || CardType.ADENDEI,
        energy: data.cardEnergy as CardEnergy || CardEnergy.PIRICA
    };

    return card;
};

/**
 * Función auxiliar para formatear diferentes tipos de timestamp que pueden venir de Firestore
 * @param timestamp Timestamp que puede ser de varios tipos
 * @returns Date si es posible convertirlo, undefined si no
 */
const formatTimestamp = (timestamp: unknown): Date | undefined => {
    if (!timestamp) return undefined;
    
    try {
        // Caso 1: Es un Timestamp de Firestore con método toDate()
        if (timestamp instanceof Timestamp) {
            return timestamp.toDate();
        }
        
        // Caso 1b: Es un objeto que tiene método toDate pero no es instancia directa de Timestamp
        if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && 
            typeof (timestamp as { toDate: () => Date }).toDate === 'function') {
            return (timestamp as { toDate: () => Date }).toDate();
        }
        
        // Caso 2: Es un string con fecha ISO
        if (typeof timestamp === 'string') {
            return new Date(timestamp);
        }
        
        // Caso 3: Es un número (timestamp en milisegundos)
        if (typeof timestamp === 'number') {
            return new Date(timestamp);
        }
        
        // Caso 4: Es un objeto Date
        if (timestamp instanceof Date) {
            return timestamp;
        }
        
        // Si no es ninguno de los anteriores, retornar undefined
        return undefined;
    } catch (error) {
        console.error('Error al formatear timestamp:', error, timestamp);
        return undefined;
    }
};

// Obtener todas las cartas (DEPRECATED: usar versión paginada)
export const getAllCards = async (): Promise<CardDetails[]> => {
    const cacheKey = 'getAllCards';

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            const cardsCol = collection(db, COLLECTION_NAME);
            const cardsSnapshot = await getDocs(cardsCol);

            const cards = cardsSnapshot.docs.map(convertDocToCardDetails);

            // Optimizar payload para reducir tamaño
            return optimizePayload(cards, { excludeKeys: PAYLOAD_EXCLUDE_KEYS });
        } catch (error) {
            console.error('Error al obtener las cartas:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL.ALL_CARDS);
};

// Obtener cartas paginadas
export const getPaginatedCards = async (
    pageSize: number = 20,
    lastVisible?: DocumentSnapshot,
    filters?: {
        type?: string;
        rarity?: string;
        search?: string;
    }
): Promise<PaginatedCards> => {
    try {
        // Construir filtros
        const queryConstraints: QueryConstraint[] = [];

        if (filters?.type) {
            queryConstraints.push(where("type", "==", filters.type));
        }

        if (filters?.rarity) {
            queryConstraints.push(where("rarity", "==", filters.rarity));
        }

        // Siempre ordenar para que la paginación funcione correctamente
        queryConstraints.push(orderBy("name", "asc"));
        queryConstraints.push(limit(pageSize));

        // Si hay un documento desde donde continuar
        if (lastVisible) {
            queryConstraints.push(startAfter(lastVisible));
        }

        // Construir la consulta
        const cardsCol = collection(db, COLLECTION_NAME);
        const cardsQuery = query(cardsCol, ...queryConstraints);

        // Ejecutar consulta
        const cardsSnapshot = await getDocs(cardsQuery);

        // Obtener contador total (solo primera vez)
        let totalCards = 0;
        if (!lastVisible) {
            // Para contador, usar solo los filtros, sin limit o startAfter
            const countQuery = filters?.type || filters?.rarity
                ? query(
                    collection(db, COLLECTION_NAME),
                    ...(filters?.type ? [where("type", "==", filters.type)] : []),
                    ...(filters?.rarity ? [where("rarity", "==", filters.rarity)] : [])
                )
                : collection(db, COLLECTION_NAME);

            const countSnapshot = await getCountFromServer(countQuery);
            totalCards = countSnapshot.data().count;
        }

        // Transformar resultados
        const cards = cardsSnapshot.docs.map(convertDocToCardDetails);

        // Optimizar payload
        const optimizedCards = optimizePayload(cards, { excludeKeys: PAYLOAD_EXCLUDE_KEYS });

        return {
            cards: optimizedCards,
            lastVisible: cardsSnapshot.docs.length > 0
                ? cardsSnapshot.docs[cardsSnapshot.docs.length - 1]
                : null,
            totalCards
        };
    } catch (error) {
        console.error('Error al obtener las cartas paginadas:', error);
        logError(error);
        throw error;
    }
};

// Obtener una carta por su ID
export const getCardById = async (cardId: string): Promise<CardDetails | null> => {
    const cacheKey = `card:${cardId}`;

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            const cardRef = doc(db, COLLECTION_NAME, cardId);
            const cardSnap = await getDoc(cardRef);

            if (cardSnap.exists()) {
                const cardData = convertDocToCardDetails(cardSnap);
                return cardData;
            }

            return null;
        } catch (error) {
            console.error('Error al obtener la carta:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL.CARD_DETAILS);
};

// Obtener múltiples cartas por sus IDs
export const getCardsByIds = async (cardIds: string[], skipCache: boolean = false): Promise<CardDetails[]> => {
    try {
        console.log(`[getCardsByIds] Loading ${cardIds.length} cards, skipCache:`, skipCache);
        
        // Si no hay IDs, devolvemos un array vacío
        if (!cardIds || !cardIds.length) {
            return [];
        }

        // Verificar si algunas cartas están en caché (solo si no se especifica skipCache)
        const cachedCards: Record<string, CardDetails> = {};
        const idsToFetch: string[] = [];

        for (const id of cardIds) {
            // Si el ID es undefined o null, ignorarlo
            if (!id) continue;

            if (skipCache) {
                // Si skipCache es true, obtener todas las cartas frescas
                idsToFetch.push(id);
            } else {
                const cacheKey = `card:${id}`;
                const cachedCard = cacheService.get<CardDetails>(cacheKey);

                if (cachedCard) {
                    cachedCards[id] = cachedCard;
                } else {
                    idsToFetch.push(id);
                }
            }
        }

        // Si todas las cartas estaban en caché
        if (idsToFetch.length === 0) {
            return cardIds
                .filter(id => id && cachedCards[id])
                .map(id => cachedCards[id]);
        }

        // Obtener las cartas que no estaban en caché
        const cardsCol = collection(db, COLLECTION_NAME);
        const batchSize = 10; // Firestore permite hasta 10 condiciones OR
        const batchedResults: CardDetails[] = [];

        // Procesar en lotes de 10 IDs para respetar límites de Firestore
        for (let i = 0; i < idsToFetch.length; i += batchSize) {
            const batchIds = idsToFetch.slice(i, i + batchSize);
            const q = query(cardsCol, where("__name__", "in", batchIds));
            const querySnapshot = await getDocs(q);

            // Procesar resultados y guardar en caché solo si no se especifica skipCache
            querySnapshot.docs.forEach(doc => {
                const card = convertDocToCardDetails(doc);

                // Guardar en caché para futuros usos (solo si no se especifica skipCache)
                if (!skipCache) {
                    cacheService.set(`card:${card.id}`, card, CACHE_TTL.CARD_DETAILS);
                }

                batchedResults.push(card);
            });
        }

        // Combinar resultados de caché y consulta
        const cachedResults = Object.values(cachedCards);
        const allResults = [...cachedResults, ...batchedResults];

        // Ordenar según el orden de los IDs originales
        const idToCardMap = new Map<string, CardDetails>();
        allResults.forEach(card => {
            if (card.id) {
                idToCardMap.set(card.id, card);
            }
        });

        return cardIds
            .filter(id => id && idToCardMap.has(id))
            .map(id => idToCardMap.get(id)!);
    } catch (error) {
        console.error('Error al obtener las cartas por IDs:', error);
        logError(error);
        throw error;
    }
};

// Función para consultar cartas con filtros adaptada al schema
export const queryCards = async (filters: {
    searchTerm?: string;
    type?: CardType | 'all_types';
    energy?: CardEnergy | 'all_energies';
    rarity?: CardRarity | 'all_rarities';
    set?: CardSet | 'all_sets';
    artist?: string | 'all_artists';
    standardLegal?: boolean;
}): Promise<CardDetails[]> => {
    console.log('[queryCards] Filtros recibidos:', filters); 
    try {
        const cardsCol = collection(db, COLLECTION_NAME);
        
        // Si no hay filtros específicos, usamos una consulta simple
        if ((!filters.type || filters.type === 'all_types') && 
            (!filters.energy || filters.energy === 'all_energies') && 
            (!filters.rarity || filters.rarity === 'all_rarities') && 
            (!filters.set || filters.set === 'all_sets') && 
            (!filters.artist || filters.artist === 'all_artists') && 
            !filters.standardLegal && 
            !filters.searchTerm) {
            
            // Sin filtros, obtener todas las cartas
            console.log('[queryCards] Sin filtros específicos, obteniendo todas las cartas');
            const allCardsSnapshot = await getDocs(cardsCol);
            return allCardsSnapshot.docs.map(convertDocToCardDetails);
        }
        
        // Lista para almacenar restricciones de consulta
        const queryConstraints: QueryConstraint[] = [];
        
        // Determinar qué restricciones agregar según los filtros
        // IMPORTANTE: Usar los nombres correctos de campos en Firestore
        if (filters.type && filters.type !== 'all_types') {
            queryConstraints.push(where("cardType", "==", filters.type));
        }
        
        if (filters.energy && filters.energy !== 'all_energies') {
            queryConstraints.push(where("cardEnergy", "==", filters.energy));
        }
        
        if (filters.rarity && filters.rarity !== 'all_rarities') {
            queryConstraints.push(where("rarity", "==", filters.rarity));
        }
        
        if (filters.set && filters.set !== 'all_sets') {
            queryConstraints.push(where("setName", "==", filters.set));
        }
        
        if (filters.standardLegal === true) {
            queryConstraints.push(where("standardLegal", "==", true));
        }
        
        // Para el artista, necesitamos usar array-contains si es un array en Firestore
        if (filters.artist && filters.artist !== 'all_artists') {
            queryConstraints.push(where("artists", "array-contains", filters.artist));
        }
        
        // Ordenar siempre por nombre
        queryConstraints.push(orderBy("name", "asc"));
        
        console.log('[queryCards] Restricciones de consulta aplicadas:', 
            queryConstraints.map(c => {
                // Convertir a unknown primero y luego al tipo específico
                const constraint = c as unknown as { 
                    _field?: { segments?: string[] }; 
                    _op?: string; 
                    _value?: unknown 
                };
                return `${constraint._field?.segments?.join('.')} ${constraint._op} ${constraint._value}`;
            })
        );
        
        // Construir y ejecutar la consulta
        const cardsQuery = query(cardsCol, ...queryConstraints);
        const cardsSnapshot = await getDocs(cardsQuery);
        
        console.log(`[queryCards] Documentos encontrados: ${cardsSnapshot.docs.length}`);
        
        // Debug: Mostrar el primer documento para verificar estructura
        if (cardsSnapshot.docs.length > 0) {
            console.log('[queryCards] Ejemplo de documento:', cardsSnapshot.docs[0].data());
        }
        
        // Convertir documentos a objetos CardDetails
        const cards = cardsSnapshot.docs.map(convertDocToCardDetails);
        
        // Aplicar filtro de búsqueda por texto en el cliente si es necesario
        if (filters.searchTerm) {
            const searchTermLower = filters.searchTerm.toLowerCase();
            return cards.filter(card => 
                card.name.toLowerCase().includes(searchTermLower) ||
                (card.artist && card.artist.some(a => a.toLowerCase().includes(searchTermLower))) ||
                (card.fullId && card.fullId.toLowerCase().includes(searchTermLower))
            );
        }
        
        return cards;
    } catch (error) {
        console.error('[queryCards] Error al consultar cartas:', error);
        logError(error);
        toast.error('Error al buscar cartas. Por favor, intenta de nuevo.');
        return [];
    }
};

// Obtener cartas por tipo (puede simplificarse o eliminarse si queryCards es suficiente)
export const getCardsByType = async (type: string): Promise<CardDetails[]> => {
    const cacheKey = `cardsByType:${type}`;

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            const cardsCol = collection(db, COLLECTION_NAME);
            const q = query(cardsCol, where("type", "==", type));
            const cardsSnapshot = await getDocs(q);

            const cards = cardsSnapshot.docs.map(convertDocToCardDetails);
            return optimizePayload(cards, { excludeKeys: PAYLOAD_EXCLUDE_KEYS });
        } catch (error) {
            console.error('Error al obtener las cartas por tipo:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL.CARD_SEARCH);
};

/**
 * Obtiene la URL de la imagen de una carta por su ID
 */
export const getCardImageUrl = (cardId: string): string => {
    if (!cardId) return '';
    return `https://storage.googleapis.com/kodemcards.appspot.com/cards/${cardId}.png`;
};

// --- Funciones CRUD adaptadas al schema --- 

/**
 * Función auxiliar para eliminar valores undefined de forma recursiva
 */
const removeUndefinedValues = <T extends Record<string, unknown>>(obj: T): T => {
    const result = { ...obj };
    Object.keys(result).forEach(key => {
        if (result[key] === undefined) {
            delete result[key];
        }
    });
    return result;
};

/**
 * Añade una nueva carta a Firestore (adaptado al schema).
 * @param cardData - Datos de la carta (interfaz Card de types/card.ts).
 * @returns El ID de la nueva carta creada.
 */
export const addCard = async (cardData: Omit<Card, 'id'>): Promise<string> => {
    try {
        const cardsCol = collection(db, COLLECTION_NAME);
        
        // Mapear de la interfaz Card a los nombres de campo del schema
        const cardDataWithEnums: Record<string, unknown> = {
            name: cardData.name,
            cardType: cardData.type,         // type -> cardType
            cardEnergy: cardData.energy,     // energy -> cardEnergy
            rarity: cardData.rarity,
            setName: cardData.cardSet,      // cardSet -> setName
            imageUrl: cardData.imageUrl,
            cardNumber: cardData.cardNumber,
            fullId: cardData.fullId,
            power: cardData.power,
            sleep: cardData.sleep,
            description: cardData.description,
            rules: cardData.rules,
            artists: cardData.artist,       // artist -> artists
            // Añadir explícitamente el campo prices
            prices: cardData.prices || { amount: 0, currency: 'MXN', lastUpdate: new Date().toISOString() },
            // Asegurarse de que standardLegal también se guarde
            standardLegal: cardData.standardLegal !== undefined ? cardData.standardLegal : true,
            // NO incluir name_lowercase
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        
        // Añadir campo emulador para usar con las reglas de seguridad en entorno de desarrollo
        if (isUsingEmulators) {
            cardDataWithEnums.emulator = true;
        }

        // Limpiar todos los valores undefined de forma recursiva
        const cardDataToSave: Partial<FirestoreCardDocument> = removeUndefinedValues(cardDataWithEnums);

        console.log("[addCard] Datos a guardar en Firestore:", cardDataToSave);

        const docRef = await addDoc(cardsCol, cardDataToSave);
        return docRef.id;
    } catch (error) {
        console.error("[addCard] Error al añadir la carta:", error);
        logError(error);
        toast.error("Error al crear la nueva carta.");
        throw error;
    }
};

/**
 * Actualiza una carta existente en Firestore (adaptado al schema).
 * @param cardId - El ID de la carta a actualizar.
 * @param cardData - Los datos a actualizar (Partial<Card>).
 */
export const updateCard = async (cardId: string, cardData: Partial<Omit<Card, 'id'>>): Promise<void> => {
    try {
        const cardRef = doc(db, COLLECTION_NAME, cardId);
        
        // Mapear de la interfaz Card a los nombres de campo del schema para actualizar
        const dataToUpdate: { [key: string]: unknown } = { 
            updatedAt: Timestamp.now()
        };

        // Mapear solo los campos presentes en cardData
        if (cardData.name !== undefined) dataToUpdate.name = cardData.name;
        if (cardData.type !== undefined) dataToUpdate.cardType = cardData.type;
        if (cardData.energy !== undefined) dataToUpdate.cardEnergy = cardData.energy;
        if (cardData.rarity !== undefined) dataToUpdate.rarity = cardData.rarity;
        if (cardData.cardSet !== undefined) dataToUpdate.setName = cardData.cardSet;
        if (cardData.imageUrl !== undefined) dataToUpdate.imageUrl = cardData.imageUrl;
        if (cardData.cardNumber !== undefined) dataToUpdate.cardNumber = cardData.cardNumber;
        if (cardData.fullId !== undefined) dataToUpdate.fullId = cardData.fullId;
        if (cardData.power !== undefined) dataToUpdate.power = cardData.power;
        if (cardData.sleep !== undefined) dataToUpdate.sleep = cardData.sleep;
        if (cardData.description !== undefined) dataToUpdate.description = cardData.description;
        if (cardData.rules !== undefined) dataToUpdate.rules = cardData.rules;
        if (cardData.artist !== undefined) dataToUpdate.artists = cardData.artist;
        if (cardData.prices !== undefined) dataToUpdate.prices = cardData.prices;
        if (cardData.standardLegal !== undefined) dataToUpdate.standardLegal = cardData.standardLegal;
        
        // Añadir campo emulador para usar con las reglas de seguridad en entorno de desarrollo
        if (isUsingEmulators) {
            dataToUpdate.emulator = true;
        }

        console.log("[updateCard] Actualizando carta con ID:", cardId);
        console.log("[updateCard] Datos a actualizar:", dataToUpdate);

        // Eliminar valores undefined o null
        const cleanedData = removeUndefinedValues(dataToUpdate);
        
        // Actualizar el documento
        await updateDoc(cardRef, cleanedData);
        
        // Invalidar caché relacionada
        const cacheKey = `card:${cardId}`;
        cacheService.delete(cacheKey);
        
        // También invalidar caché de consultas que podrían contener esta carta
        cacheService.invalidatePattern('getAllCards');
        cacheService.invalidatePattern('queryCards:*');
        
        console.log("[updateCard] Cache invalidated for card:", cardId);
        
    } catch (error) {
        console.error("[updateCard] Error al actualizar la carta:", error);
        logError(error);
        toast.error("Error al actualizar la carta.");
        throw error;
    }
};

/**
 * Elimina una carta de Firestore.
 * @param cardId - El ID de la carta a eliminar.
 */
export const deleteCard = async (cardId: string): Promise<void> => {
    try {
        const cardRef = doc(db, COLLECTION_NAME, cardId);
        await deleteDoc(cardRef);
        // Invalidar caché si se usa
        cacheService.delete(`card:${cardId}`);
        cacheService.delete('getAllCards'); // Invalidar caché de todas las cartas
    } catch (error) {
        console.error(`Error al eliminar la carta ${cardId}:`, error);
        logError(error);
        toast.error("Error al eliminar la carta.");
        throw error;
    }
};

// Mantener solo la exportación por defecto
export default {
    getAllCards,
    getCardById,
    getCardsByType,
    getCardImageUrl,
    addCard,
    updateCard,
    deleteCard,
    queryCards
}; 