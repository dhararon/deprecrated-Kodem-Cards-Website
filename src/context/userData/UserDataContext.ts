import { createContext } from 'react';

export interface UserData {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    preferredLanguage: string;
    createdAt: number;
    lastLogin: number;
    decks: string[];
    favorites: string[];
}

export interface UserDataContextType {
    userData: UserData | null;
    isLoadingUserData: boolean;
    updateUserPreference: (key: keyof UserData, value: unknown) => Promise<void>;
    addDeckToUser: (deckId: string) => Promise<void>;
    removeDeckFromUser: (deckId: string) => Promise<void>;
    toggleFavoriteDeck: (deckId: string) => Promise<void>;
    refreshUserData: () => Promise<void>;
}

// Exportamos el contexto
export const UserDataContext = createContext<UserDataContextType | undefined>(undefined); 