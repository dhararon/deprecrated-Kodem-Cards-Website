import { Card, CardSet, CardEnergy, CardRarity, CardType } from '@/types/card';
import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';

const COLLECTION = 'cards';

/**
 * Obtiene todas las cartas de Firestore
 */
export const getAllCards = async (): Promise<Card[]> => {
    try {
        console.log('🔥 Iniciando getAllCards en el emulador de Firestore...');
        console.log('Colección a consultar:', COLLECTION);

        // Verificar conexión al emulador
        try {
            const dbInfo = db['_settings'] || db['settings'] || {};
            console.log('Configuración de Firestore:', dbInfo);
            console.log('¿Está conectado al emulador?',
                dbInfo.host?.includes('localhost') ||
                dbInfo.host?.includes('127.0.0.1') ||
                'No se puede determinar');
        } catch (e) {
            console.log('No se pudo verificar la conexión al emulador:', e);
        }

        const cardsQuery = query(collection(db, COLLECTION), orderBy('name'));
        console.log('Query creado:', cardsQuery);

        const snapshot = await getDocs(cardsQuery);
        console.log(`🔄 Firestore devolvió ${snapshot.docs.length} documentos`);

        // Si no hay documentos, imprimir una advertencia detallada
        if (snapshot.empty) {
            console.warn('⚠️ No se encontraron documentos en la colección', COLLECTION);
            console.warn('Verifica que:');
            console.warn('1. El emulador esté funcionando correctamente');
            console.warn('2. La colección exista en el emulador');
            console.warn('3. Haya datos en la colección');
            return [];
        }

        // Mapear los documentos a objetos Card
        const result = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`📄 Procesando documento con ID ${doc.id}:`, data);

            // Asegurarse de que cardSet es un valor válido del enum
            let cardSetValue: CardSet = CardSet.PROMOS;
            if (data.cardSet) {
                // Intentar encontrar el valor correspondiente en el enum
                const matchingEnum = Object.values(CardSet).find(
                    enumValue => enumValue.toLowerCase() === String(data.cardSet).toLowerCase()
                );
                if (matchingEnum) {
                    cardSetValue = matchingEnum;
                }
            }

            // Hacer lo mismo con type y energy
            let typeValue: CardType = CardType.ADENDEI;
            if (data.type) {
                const matchingType = Object.values(CardType).find(
                    enumValue => enumValue.toLowerCase() === String(data.type).toLowerCase()
                );
                if (matchingType) {
                    typeValue = matchingType;
                }
            }

            let energyValue: CardEnergy = CardEnergy.PIRICA;
            if (data.energy) {
                const matchingEnergy = Object.values(CardEnergy).find(
                    enumValue => enumValue.toLowerCase() === String(data.energy).toLowerCase()
                );
                if (matchingEnergy) {
                    energyValue = matchingEnergy;
                }
            }

            // Crear objeto Card con los valores correctos de los enums
            const card: Card & { id: string } = {
                ...data,
                id: doc.id,
                // Asegurar que tenemos valores para todas las propiedades requeridas
                name: data.name || '',
                cardType: typeValue,
                cardEnergy: energyValue,
                rarity: data.rarity || CardRarity.COMUN,
                cardSet: cardSetValue,
                imageUrl: data.imageUrl || '',
                cardNumber: data.cardNumber || 0,
                prices: data.prices || { amount: 0, currency: 'MXN', lastUpdate: new Date().toISOString() },
                rules: data.rules || [],
                artist: data.artist || [],
                // Mantener campos legacy para compatibilidad
                type: typeValue,
                energy: energyValue
            };

            return card;
        });

        console.log(`✅ Procesadas ${result.length} cartas correctamente`);
        return result;
    } catch (error) {
        console.error('❌ Error al obtener cartas:', error);
        throw new Error('No se pudieron cargar las cartas');
    }
};

/**
 * Obtiene una carta por su ID
 */
export const getCardById = async (id: string): Promise<Card> => {
    try {
        const cardDoc = await getDoc(doc(db, COLLECTION, id));

        if (!cardDoc.exists()) {
            throw new Error('La carta no existe');
        }

        const data = cardDoc.data();
        return {
            ...data,
            id: cardDoc.id,
            // Asegurar que tenemos valores para todas las propiedades requeridas
            name: data.name || '',
            cardType: data.type || CardType.ADENDEI,
            cardEnergy: data.energy || CardEnergy.PIRICA,
            rarity: data.rarity || CardRarity.COMUN,
            cardSet: data.cardSet || CardSet.PROMOS,
            imageUrl: data.imageUrl || '',
            cardNumber: data.cardNumber || 0,
            prices: data.prices || { amount: 0, currency: 'MXN', lastUpdate: new Date().toISOString() },
            rules: data.rules || [],
            artist: data.artist || [],
            // Mantener campos legacy para compatibilidad
            type: data.type || CardType.ADENDEI,
            energy: data.energy || CardEnergy.PIRICA
        } as unknown as Card;
    } catch (error) {
        console.error(`Error al obtener la carta con ID ${id}:`, error);
        throw new Error('No se pudo cargar la carta');
    }
};

/**
 * Crea una nueva carta
 */
export const createCard = async (cardData: Omit<Card, 'id'>): Promise<string> => {
    try {
        // Crear documento en Firestore
        const newCardData = {
            ...cardData
        };

        const docRef = await addDoc(collection(db, COLLECTION), newCardData);
        return docRef.id;
    } catch (error) {
        console.error('Error al crear carta:', error);
        throw new Error('No se pudo crear la carta');
    }
};

/**
 * Actualiza una carta existente
 */
export const updateCard = async (id: string, cardData: Partial<Card>): Promise<void> => {
    try {
        await updateDoc(doc(db, COLLECTION, id), cardData);
    } catch (error) {
        console.error(`Error al actualizar la carta con ID ${id}:`, error);
        throw new Error('No se pudo actualizar la carta');
    }
};

/**
 * Elimina una carta
 */
export const deleteCard = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
        console.error(`Error al eliminar la carta con ID ${id}:`, error);
        throw new Error('No se pudo eliminar la carta');
    }
};

/**
 * Obtiene cartas filtradas por tipo
 */
export const getCardsByType = async (type: CardType): Promise<Card[]> => {
    try {
        const cardsQuery = query(
            collection(db, COLLECTION),
            where('type', '==', type),
            orderBy('name')
        );

        const snapshot = await getDocs(cardsQuery);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                // Asegurar que tenemos valores para todas las propiedades requeridas
                name: data.name || '',
                cardType: data.type || CardType.ADENDEI,
                cardEnergy: data.energy || CardEnergy.PIRICA,
                rarity: data.rarity || CardRarity.COMUN,
                cardSet: data.cardSet || CardSet.PROMOS,
                imageUrl: data.imageUrl || '',
                cardNumber: data.cardNumber || 0,
                prices: data.prices || { amount: 0, currency: 'MXN', lastUpdate: new Date().toISOString() },
                rules: data.rules || [],
                artist: data.artist || [],
                // Mantener campos legacy para compatibilidad
                type: data.type || CardType.ADENDEI,
                energy: data.energy || CardEnergy.PIRICA
            } as unknown as Card;
        });
    } catch (error) {
        console.error(`Error al obtener cartas por tipo ${type}:`, error);
        throw new Error('No se pudieron cargar las cartas filtradas');
    }
};

/**
 * Obtiene cartas filtradas por energía
 */
export const getCardsByEnergy = async (energy: CardEnergy): Promise<Card[]> => {
    try {
        const cardsQuery = query(
            collection(db, COLLECTION),
            where('energy', '==', energy),
            orderBy('name')
        );

        const snapshot = await getDocs(cardsQuery);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                // Asegurar que tenemos valores para todas las propiedades requeridas
                name: data.name || '',
                cardType: data.type || CardType.ADENDEI,
                cardEnergy: data.energy || CardEnergy.PIRICA,
                rarity: data.rarity || CardRarity.COMUN,
                cardSet: data.cardSet || CardSet.PROMOS,
                imageUrl: data.imageUrl || '',
                cardNumber: data.cardNumber || 0,
                prices: data.prices || { amount: 0, currency: 'MXN', lastUpdate: new Date().toISOString() },
                rules: data.rules || [],
                artist: data.artist || [],
                // Mantener campos legacy para compatibilidad
                type: data.type || CardType.ADENDEI,
                energy: data.energy || CardEnergy.PIRICA
            } as unknown as Card;
        });
    } catch (error) {
        console.error(`Error al obtener cartas por energía ${energy}:`, error);
        throw new Error('No se pudieron cargar las cartas filtradas');
    }
};

export default {
    getAllCards,
    getCardById,
    createCard,
    updateCard,
    deleteCard,
    getCardsByType,
    getCardsByEnergy
}; 