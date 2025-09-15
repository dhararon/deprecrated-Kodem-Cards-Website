import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sube una imagen a Firebase Storage
 * @param file - Archivo a subir
 * @param path - Ruta donde se guardará el archivo (ej: 'cards', 'users')
 * @returns URL de descarga de la imagen
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
        // Crear un nombre único para el archivo
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const fullPath = `${path}/${fileName}`;

        // Referencia al archivo en Firebase Storage
        const storageRef = ref(storage, fullPath);

        // Subir el archivo
        const snapshot = await uploadBytes(storageRef, file);

        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw new Error('Error al subir la imagen. Inténtalo de nuevo.');
    }
};

/**
 * Elimina una imagen de Firebase Storage
 * @param url - URL de la imagen a eliminar
 */
export const deleteImage = async (url: string): Promise<void> => {
    try {
        // Extraer la ruta del archivo de la URL
        const decodedUrl = decodeURIComponent(url);
        const startIndex = decodedUrl.indexOf('/o/') + 3;
        const endIndex = decodedUrl.indexOf('?');
        const filePath = decodedUrl.substring(startIndex, endIndex);

        // Referencia al archivo en Firebase Storage
        const storageRef = ref(storage, filePath);

        // Eliminar el archivo
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        throw new Error('Error al eliminar la imagen. Inténtalo de nuevo.');
    }
}; 