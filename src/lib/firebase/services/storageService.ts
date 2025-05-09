import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import logger from '@/lib/utils/logger';

/**
 * Sube un archivo a Firebase Storage
 * @param file Archivo a subir
 * @param path Ruta donde se guardará el archivo (ej: 'cards/image.jpg')
 * @returns URL del archivo subido
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
        // Crear referencia al archivo
        const storageRef = ref(storage, path);

        // Subir el archivo
        const snapshot = await uploadBytes(storageRef, file);

        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        logger.error('Error al subir archivo:', { error });
        throw error;
    }
};

/**
 * Obtiene la URL de descarga de un archivo
 * @param path Ruta del archivo en Storage
 * @returns URL de descarga
 */
export const getFileURL = async (path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    } catch (error) {
        logger.error('Error al obtener URL del archivo:', { error });
        throw error;
    }
};

/**
 * Elimina un archivo de Firebase Storage
 * @param path Ruta del archivo a eliminar
 */
export const deleteFile = async (path: string): Promise<void> => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error) {
        logger.error('Error al eliminar archivo:', { error });
        throw error;
    }
};

/**
 * Sanitiza un string para usarlo como nombre de carpeta o archivo
 * - Elimina acentos
 * - Reemplaza espacios por guiones bajos
 * - Convierte a minúsculas
 * @param text Texto a sanitizar
 * @returns Texto sanitizado
 */
export const sanitizeFileName = (text: string): string => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/\s+/g, '_') // Reemplazar espacios por guiones bajos
        .toLowerCase(); // Convertir a minúsculas
};

/**
 * Genera un nombre de archivo sanitizado para una carta
 * @param fullId ID completo de la carta
 * @returns Nombre sanitizado en mayúsculas sin espacios
 */
export const sanitizeCardFileName = (fullId: string): string => {
    return fullId
        .toUpperCase()
        .replace(/\s+/g, ''); // Eliminar todos los espacios
};

/**
 * Descarga una imagen desde una URL y la sube a Firebase Storage
 * @param imageUrl URL de la imagen a descargar
 * @param cardSet Set de la carta (para determinar la carpeta)
 * @param fullId ID completo de la carta (para el nombre del archivo)
 * @returns URL del archivo subido a Firebase Storage
 */
export const downloadAndUploadImage = async (
    imageUrl: string,
    cardSet: string,
    fullId: string
): Promise<string> => {
    try {
        // Sanitizar el nombre del set para la carpeta
        const folderName = sanitizeFileName(cardSet);

        // Obtener el nombre del archivo basado en el fullId
        const fileName = sanitizeCardFileName(fullId);

        // Determinar la extensión basada en la URL
        let extension = 'jpg'; // Por defecto
        if (imageUrl.toLowerCase().includes('.png')) extension = 'png';
        else if (imageUrl.toLowerCase().includes('.gif')) extension = 'gif';
        else if (imageUrl.toLowerCase().includes('.webp')) extension = 'webp';

        // Crear la ruta del archivo
        const filePath = `cards/${folderName}/${fileName}.${extension}`;

        // Descargar la imagen
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Error al descargar la imagen: ${response.statusText}`);

        // Convertir la respuesta a un blob
        const blob = await response.blob();

        // Crear un File a partir del blob
        const file = new File([blob], `${fileName}.${extension}`, { type: blob.type });

        // Subir el archivo a Firebase Storage
        return await uploadFile(file, filePath);
    } catch (error) {
        logger.error('Error al descargar y subir imagen:', { error });
        throw error;
    }
};

/**
 * Genera una ruta única para un archivo
 * @param fileName Nombre del archivo original
 * @param folder Carpeta donde se guardará
 * @returns Ruta única para el archivo
 */
export const generateUniquePath = (fileName: string, folder: string = 'cards'): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    return `${folder}/${timestamp}-${randomString}.${extension}`;
}; 