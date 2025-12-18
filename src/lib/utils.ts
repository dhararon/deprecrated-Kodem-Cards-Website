import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind de manera eficiente, fusionando clases y evitando duplicados
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un precio con el símbolo de moneda adecuado
 */
export function formatPrice(amount: number, currency: string = "MXN") {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  } else if (currency === "EUR") {
    return `€${amount.toFixed(2)}`;
  } else {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Espera un tiempo específico en milisegundos
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Genera un ID único
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Definir una interfaz para el tipo de datos de deck
export interface DeckData {
  status?: 'public' | 'private' | 'draft';
  isPublic?: boolean; // Deprecated: use status instead
  userId?: string;
  [key: string]: unknown; // Para otras propiedades que pueda tener el deck
}

// Función para determinar si un usuario puede ver un deck específico
export function canViewDeck(deckData: DeckData | null | undefined, userId?: string | null) {
  if (!deckData) return false;

  // Si el deck es público, cualquiera puede verlo
  const status = deckData.status || (deckData.isPublic ? 'public' : 'private');
  if (status === 'public') return true;

  // Si el usuario es el propietario del deck, puede verlo
  if (userId && deckData.userId === userId) return true;

  // En cualquier otro caso, no tiene permiso
  return false;
}
