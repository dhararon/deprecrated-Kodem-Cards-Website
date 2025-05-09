import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CardSet {
    id?: string;
    name: string;
    img_url: string;
    cardId?: number;
}

const COLLECTION = 'cardSets';

/**
 * Obtiene todos los sets de cartas
 */
export const getAllSets = async (): Promise<CardSet[]> => {
    try {
        const setsQuery = query(collection(db, COLLECTION), orderBy('cardId', 'desc'));

        const snapshot = await getDocs(setsQuery);

        if (snapshot.empty) {
            return [];
        }

        const result = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            } as CardSet;
        });

        return result;
    } catch {
        throw new Error('No se pudieron cargar los sets de cartas');
    }
};

/**
 * Obtiene un set de cartas por su ID
 */
export const getSetById = async (id: string): Promise<CardSet> => {
    try {
        const setDoc = await getDoc(doc(db, COLLECTION, id));

        if (!setDoc.exists()) {
            throw new Error('El set de cartas no existe');
        }

        return {
            id: setDoc.id,
            ...setDoc.data()
        } as CardSet;
    } catch {
        throw new Error('No se pudo cargar el set de cartas');
    }
};

/**
 * Crea un nuevo set de cartas
 */
export const createSet = async (setData: Omit<CardSet, 'id'>): Promise<string> => {
    try {
        const newSet = {
            ...setData,
            cardId: setData.cardId || Date.now()
        };

        const docRef = await addDoc(collection(db, COLLECTION), newSet);
        return docRef.id;
    } catch {
        throw new Error('No se pudo crear el set de cartas');
    }
};

/**
 * Actualiza un set de cartas existente
 */
export const updateSet = async (id: string, setData: Partial<CardSet>): Promise<void> => {
    try {
        await updateDoc(doc(db, COLLECTION, id), setData);
    } catch {
        throw new Error('No se pudo actualizar el set de cartas');
    }
};

/**
 * Elimina un set de cartas
 */
export const deleteSet = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
    } catch {
        throw new Error('No se pudo eliminar el set de cartas');
    }
};

/**
 * Obtiene todos los sets (no hay filtros adicionales con el nuevo esquema)
 */
export const getActiveSets = async (): Promise<CardSet[]> => {
    return getAllSets();
};

export default {
    getAllSets,
    getSetById,
    createSet,
    updateSet,
    deleteSet,
    getActiveSets
}; 