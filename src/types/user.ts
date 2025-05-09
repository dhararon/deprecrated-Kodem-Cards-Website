/**
 * Tipos stub generados automáticamente
 */

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  role?: 'admin' | 'user' | 'grader';
  createdAt?: string | null;
}

export type UserPreferences = {
  theme?: 'light' | 'dark' | 'system';
  language?: 'es' | 'en';
  notifications?: boolean;
}

export interface UserData {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  favorites?: string[];
  decks?: UserDeck[];
  preferences?: UserPreferences;
  role?: 'admin' | 'user' | 'grader';
  createdAt?: string | null;
}

export interface UserDeck {
  id: string;
  name: string;
  description?: string;
  cards: string[];
  coverCardId?: string;
  createdAt: string;
  updatedAt: string;
}
