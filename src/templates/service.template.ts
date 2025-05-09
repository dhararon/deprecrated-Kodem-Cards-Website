import { db, auth } from '../lib/firebase';
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
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

// Constantes
export const COLLECTION_NAME = 'collection-name';

/**
 * Interface for data objects in this service
 */
export interface DataItem {
    /** Unique identifier */
    id: string;
    /** Name of the item */
    name: string;
    /** User who owns this item */
    userId: string;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
    /** Additional fields specific to this type */
    [key: string]: any;
}

/**
 * Interface for creating a new item
 */
export interface CreateDataInput {
    name: string;
    userId: string;
    // Add other required fields, but omit id, createdAt, and updatedAt
    [key: string]: any;
}

/**
 * Get all items for a specific user
 * 
 * @param userId - The user ID to query items for
 * @returns Array of items belonging to the user
 */
export const getItemsByUser = async (userId: string): Promise<DataItem[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        } as DataItem));

    } catch (error) {
        console.error('Error getting items:', error);
        throw new Error(`Failed to get items: ${error}`);
    }
};

/**
 * Get a single item by ID
 * 
 * @param id - The item ID to fetch
 * @returns The item or null if not found
 */
export const getItemById = async (id: string): Promise<DataItem | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate(),
            updatedAt: docSnap.data().updatedAt?.toDate(),
        } as DataItem;

    } catch (error) {
        console.error('Error getting item:', error);
        throw new Error(`Failed to get item: ${error}`);
    }
};

/**
 * Create a new item
 * 
 * @param data - The item data to create
 * @returns The created item with ID and timestamps
 */
export const createItem = async (data: CreateDataInput): Promise<DataItem> => {
    try {
        const timestamps = {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            ...timestamps
        });

        return {
            id: docRef.id,
            ...data,
            ...timestamps,
        } as unknown as DataItem;

    } catch (error) {
        console.error('Error creating item:', error);
        throw new Error(`Failed to create item: ${error}`);
    }
};

/**
 * Update an existing item
 * 
 * @param id - The ID of the item to update
 * @param data - The new data to apply
 * @returns Promise resolving when update completes
 */
export const updateItem = async (id: string, data: Partial<Omit<DataItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);

        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

    } catch (error) {
        console.error('Error updating item:', error);
        throw new Error(`Failed to update item: ${error}`);
    }
};

/**
 * Delete an item
 * 
 * @param id - The ID of the item to delete
 * @returns Promise resolving when delete completes
 */
export const deleteItem = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting item:', error);
        throw new Error(`Failed to delete item: ${error}`);
    }
};

// Export all functions as a service object
export const itemService = {
    getItemsByUser,
    getItemById,
    createItem,
    updateItem,
    deleteItem
}; 