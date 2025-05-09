/**
 * Servicio de caché para datos de Firebase
 * Implementa una estrategia de caché en memoria con expiración para mejorar el rendimiento
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface CacheConfig {
    defaultTTL: number; // Tiempo de vida por defecto en milisegundos
    maxSize: number;    // Tamaño máximo de la caché
}

class CacheService {
    private cache: Map<string, CacheItem<unknown>>;
    private config: CacheConfig;

    constructor(config?: Partial<CacheConfig>) {
        this.cache = new Map();
        this.config = {
            defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
            maxSize: 100,              // 100 elementos máximo
            ...config
        };

        // Programar limpieza periódica
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanExpiredCache(), 60 * 1000); // Limpiar cada minuto
        }
    }

    /**
     * Obtiene un elemento de la caché
     * @param key Clave única para el elemento
     * @returns El elemento o null si no existe o expiró
     */
    get<T>(key: string): T | null {
        if (!this.cache.has(key)) {
            return null;
        }

        const item = this.cache.get(key) as CacheItem<T>;
        const now = Date.now();

        // Verificar si el elemento expiró
        if (now > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Guarda un elemento en la caché
     * @param key Clave única para el elemento
     * @param data Los datos a guardar
     * @param ttl Tiempo de vida en milisegundos (opcional)
     */
    set<T>(key: string, data: T, ttl?: number): void {
        // Verificar límite de tamaño
        if (this.cache.size >= this.config.maxSize) {
            this.evictOldest();
        }

        const now = Date.now();
        const expiresAt = now + (ttl || this.config.defaultTTL);

        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt
        });
    }

    /**
     * Elimina un elemento de la caché
     * @param key Clave del elemento a eliminar
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Limpia la caché por completo
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Invalida elementos de caché que cumplan con un patrón de clave
     * @param pattern Patrón para las claves a invalidar
     */
    invalidatePattern(pattern: string | RegExp): void {
        const regex = typeof pattern === 'string'
            ? new RegExp(pattern.replace(/\*/g, '.*'))
            : pattern;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Limpia elementos expirados de la caché
     */
    private cleanExpiredCache(): void {
        const now = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Elimina el elemento más antiguo de la caché
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTimestamp) {
                oldestTimestamp = item.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Ejecuta una función y almacena su resultado en caché
     * @param key Clave para almacenar el resultado
     * @param fn Función a ejecutar
     * @param ttl Tiempo de vida opcional
     * @returns Resultado de la función
     */
    async getOrFetch<T>(
        key: string,
        fn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cachedData = this.get<T>(key);

        if (cachedData !== null) {
            return cachedData;
        }

        const data = await fn();
        this.set(key, data, ttl);
        return data;
    }
}

// Exportar una instancia singleton
export const cacheService = new CacheService();

// Tipos para el decorator
type MethodDecorator = <T>(
    target: object, 
    propertyKey: string | symbol, 
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

// Tipos específicos para los argumentos
type DecoratorArgs = unknown[];

// Exportar un decorator para métodos de clase
export function Cached(ttl?: number): MethodDecorator {
    return function (
        target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: DecoratorArgs) {
            const key = `${target.constructor.name}.${String(propertyKey)}(${JSON.stringify(args)})`;
            return cacheService.getOrFetch(key, () => originalMethod.apply(this, args), ttl);
        };

        return descriptor;
    };
}

export default cacheService; 