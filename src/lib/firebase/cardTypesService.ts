import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CardType {
    id?: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

const COLLECTION = 'cardTypes';

/**
 * Obtiene todos los tipos de cartas
 */
export const getAllCardTypes = async (): Promise<CardType[]> => {
    try {
        const typesQuery = query(collection(db, COLLECTION), orderBy('name'));
        const snapshot = await getDocs(typesQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CardType));
    } catch (error) {
        console.error('Error al obtener tipos de cartas:', error);
        throw new Error('No se pudieron cargar los tipos de cartas');
    }
};

/**
 * Obtiene un tipo de carta por su ID
 */
export const getCardTypeById = async (id: string): Promise<CardType> => {
    try {
        const typeDoc = await getDoc(doc(db, COLLECTION, id));

        if (!typeDoc.exists()) {
            throw new Error('El tipo de carta no existe');
        }

        return {
            id: typeDoc.id,
            ...typeDoc.data()
        } as CardType;
    } catch (error) {
        console.error(`Error al obtener el tipo de carta con ID ${id}:`, error);
        throw new Error('No se pudo cargar el tipo de carta');
    }
};

/**
 * Crea un nuevo tipo de carta
 */
export const createCardType = async (typeData: Omit<CardType, 'id'>): Promise<string> => {
    try {
        const now = new Date().toISOString();
        const newType = {
            ...typeData,
            createdAt: now,
            updatedAt: now
        };

        const docRef = await addDoc(collection(db, COLLECTION), newType);
        return docRef.id;
    } catch (error) {
        console.error('Error al crear tipo de carta:', error);
        throw new Error('No se pudo crear el tipo de carta');
    }
};

/**
 * Actualiza un tipo de carta existente
 */
export const updateCardType = async (id: string, typeData: Partial<CardType>): Promise<void> => {
    try {
        const updatedData = {
            ...typeData,
            updatedAt: new Date().toISOString()
        };

        await updateDoc(doc(db, COLLECTION, id), updatedData);
    } catch (error) {
        console.error(`Error al actualizar el tipo de carta con ID ${id}:`, error);
        throw new Error('No se pudo actualizar el tipo de carta');
    }
};

/**
 * Elimina un tipo de carta
 */
export const deleteCardType = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
        console.error(`Error al eliminar el tipo de carta con ID ${id}:`, error);
        throw new Error('No se pudo eliminar el tipo de carta');
    }
};

export default {
    getAllCardTypes,
    getCardTypeById,
    createCardType,
    updateCardType,
    deleteCardType
}; 