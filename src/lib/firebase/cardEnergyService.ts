import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CardEnergy {
    id: number;
    name: string;
}

const COLLECTION = 'cardEnergy';

/**
 * Obtiene todos los tipos de energía
 */
export const getAllEnergies = async (): Promise<CardEnergy[]> => {
    try {
        const energiesQuery = query(collection(db, COLLECTION), orderBy('id'));

        const snapshot = await getDocs(energiesQuery);

        if (snapshot.empty) {
            return [];
        }

        const result = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.id,
                name: data.name
            } as CardEnergy;
        });

        return result;
    } catch {
        throw new Error('No se pudieron cargar los tipos de energía');
    }
};

/**
 * Obtiene un tipo de energía por su ID
 */
export const getEnergyById = async (id: number): Promise<CardEnergy | null> => {
    try {
        const energiesQuery = query(
            collection(db, COLLECTION),
            orderBy('id')
        );

        const snapshot = await getDocs(energiesQuery);
        const energyDoc = snapshot.docs.find(doc => doc.data().id === id);

        if (!energyDoc) {
            return null;
        }

        const data = energyDoc.data();
        return {
            id: data.id,
            name: data.name
        } as CardEnergy;
    } catch {
        throw new Error('No se pudo cargar el tipo de energía');
    }
};

/**
 * Crea un nuevo tipo de energía
 */
export const createEnergy = async (energyData: Omit<CardEnergy, 'id'> & { id: number }): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION), energyData);
        return docRef.id;
    } catch {
        throw new Error('No se pudo crear el tipo de energía');
    }
};

export default {
    getAllEnergies,
    getEnergyById,
    createEnergy
}; 