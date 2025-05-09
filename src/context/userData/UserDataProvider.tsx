import React, { useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserDataContext, UserData } from './UserDataContext';

interface UserDataProviderProps {
    children: ReactNode;
}

const DEFAULT_USER_DATA: Omit<UserData, 'uid' | 'displayName' | 'email' | 'photoURL'> = {
    preferredLanguage: 'es',
    createdAt: Date.now(),
    lastLogin: Date.now(),
    decks: [],
    favorites: []
};

const UserDataProvider: React.FC<UserDataProviderProps> = ({ children }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Subscribe to user document changes
                const userDocRef = doc(db, 'users', user.uid);
                const unsubscribeSnapshot = onSnapshot(userDocRef,
                    (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            setUserData(docSnapshot.data() as UserData);
                        } else {
                            createNewUserDocument(user);
                        }
                        setIsLoadingUserData(false);
                    },
                    (error) => {
                        console.error('Error fetching user data:', error);
                        setIsLoadingUserData(false);
                    }
                );

                return () => unsubscribeSnapshot();
            } else {
                setUserData(null);
                setIsLoadingUserData(false);
                return () => {};
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const createNewUserDocument = async (user: User) => {
        try {
            const newUserData = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                ...DEFAULT_USER_DATA,
            };

            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData as UserData);
        } catch (error) {
            console.error('Error creating user document:', error);
        }
    };

    const updateUserPreference = async (key: keyof UserData, value: unknown) => {
        if (!userData) return;

        try {
            const userDocRef = doc(db, 'users', userData.uid);
            await updateDoc(userDocRef, { [key]: value });
        } catch (error) {
            console.error(`Error updating user ${key}:`, error);
            throw error;
        }
    };

    const addDeckToUser = async (deckId: string) => {
        if (!userData) return;

        if (userData.decks.includes(deckId)) return;

        try {
            const updatedDecks = [...userData.decks, deckId];
            await updateUserPreference('decks', updatedDecks);
        } catch (error) {
            console.error('Error adding deck to user:', error);
            throw error;
        }
    };

    const removeDeckFromUser = async (deckId: string) => {
        if (!userData) return;

        try {
            const updatedDecks = userData.decks.filter(id => id !== deckId);
            await updateUserPreference('decks', updatedDecks);
        } catch (error) {
            console.error('Error removing deck from user:', error);
            throw error;
        }
    };

    const toggleFavoriteDeck = async (deckId: string) => {
        if (!userData) return;

        try {
            let updatedFavorites;
            if (userData.favorites.includes(deckId)) {
                updatedFavorites = userData.favorites.filter(id => id !== deckId);
            } else {
                updatedFavorites = [...userData.favorites, deckId];
            }
            await updateUserPreference('favorites', updatedFavorites);
        } catch (error) {
            console.error('Error toggling favorite deck:', error);
            throw error;
        }
    };

    const refreshUserData = async () => {
        if (!userData) return;

        try {
            setIsLoadingUserData(true);
            const userDocRef = doc(db, 'users', userData.uid);
            const docSnapshot = await getDoc(userDocRef);
            if (docSnapshot.exists()) {
                setUserData(docSnapshot.data() as UserData);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
            throw error;
        } finally {
            setIsLoadingUserData(false);
        }
    };

    const value = {
        userData,
        isLoadingUserData,
        updateUserPreference,
        addDeckToUser,
        removeDeckFromUser,
        toggleFavoriteDeck,
        refreshUserData
    };

    return (
        <UserDataContext.Provider value={value}>
            {children}
        </UserDataContext.Provider>
    );
};

export default UserDataProvider; 