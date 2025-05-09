/**
 * Optimizador de payloads para reducir el tamaño de los datos transferidos
 * entre el cliente y el servidor
 */

/**
 * Tipo genérico para objetos de tipo registro
 */
export type DataObject = Record<string, unknown>;

/**
 * Limpia un objeto eliminando propiedades indefinidas, nulas o vacías
 * @param obj Objeto a limpiar
 * @returns Objeto limpio
 */
export function cleanObject<T extends DataObject>(obj: T): Partial<T> {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }

    const result: Partial<T> = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];

            // Excluir propiedades nulas o indefinidas
            if (value === null || value === undefined) {
                continue;
            }

            // Recursivamente limpiar objetos anidados
            if (typeof value === 'object' && !Array.isArray(value)) {
                const cleaned = cleanObject(value as DataObject);
                if (Object.keys(cleaned).length > 0) {
                    result[key] = cleaned as T[Extract<keyof T, string>];
                }
                continue;
            }

            // Para arrays, filtrar elementos nulos y aplicar limpieza a objetos
            if (Array.isArray(value)) {
                const cleanedArray = value
                    .filter((item) => item !== null && item !== undefined)
                    .map((item) => typeof item === 'object' ? cleanObject(item as DataObject) : item);

                if (cleanedArray.length > 0) {
                    result[key] = cleanedArray as T[Extract<keyof T, string>];
                }
                continue;
            }

            // Excluir strings vacíos
            if (typeof value === 'string' && value.trim() === '') {
                continue;
            }

            // Mantener el resto de valores
            result[key] = value as T[Extract<keyof T, string>];
        }
    }

    return result;
}

/**
 * Elimina propiedades específicas de un objeto o array de objetos
 * @param data Objeto o array de objetos a procesar
 * @param keys Array de claves a eliminar
 * @returns Objeto o array con las propiedades eliminadas
 */
export function removeProperties<T>(data: T, keys: string[]): Partial<T> {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => removeProperties(item, keys)) as unknown as Partial<T>;
    }

    if (typeof data === 'object') {
        const result: DataObject = {};

        for (const key in data as DataObject) {
            if (!keys.includes(key)) {
                const value = (data as DataObject)[key];

                // Recursivamente procesar objetos anidados
                if (typeof value === 'object' && value !== null) {
                    result[key] = removeProperties(value, keys);
                } else {
                    result[key] = value;
                }
            }
        }

        return result as Partial<T>;
    }

    return data;
}

/**
 * Selecciona solo las propiedades específicas de un objeto o array de objetos
 * @param data Objeto o array de objetos a procesar
 * @param keys Array de claves a mantener
 * @returns Objeto o array con solo las propiedades especificadas
 */
export function selectProperties<T>(data: T, keys: string[]): Partial<T> {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => selectProperties(item, keys)) as unknown as Partial<T>;
    }

    if (typeof data === 'object') {
        const result: DataObject = {};

        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = (data as DataObject)[key];
            }
        }

        return result as Partial<T>;
    }

    return data;
}

/**
 * Opciones para la optimización de payload
 */
export interface OptimizeOptions {
    removeEmpty?: boolean;
    excludeKeys?: string[];
    includeOnlyKeys?: string[];
}

/**
 * Comprime los datos para transferencia eliminando redundancias y propiedades innecesarias
 * @param data Datos a comprimir
 * @param options Opciones de compresión
 * @returns Datos comprimidos
 */
export function optimizePayload<T>(
    data: T,
    options: OptimizeOptions = {}
): Partial<T> {
    const { removeEmpty = true, excludeKeys = [], includeOnlyKeys } = options;

    let result: T = data;

    // Primero eliminar propiedades no deseadas
    if (excludeKeys.length > 0) {
        result = removeProperties(result, excludeKeys) as T;
    }

    // Luego seleccionar solo las propiedades deseadas si se especificaron
    if (includeOnlyKeys && includeOnlyKeys.length > 0) {
        result = selectProperties(result, includeOnlyKeys) as T;
    }

    // Finalmente limpiar valores vacíos si se solicita
    if (removeEmpty && typeof result === 'object' && result !== null) {
        result = cleanObject(result as unknown as DataObject) as T;
    }

    return result;
}

export default optimizePayload; 