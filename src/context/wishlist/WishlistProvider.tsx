import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WishList, WishListCard, WishListPriority, EnrichedWishListCard, AddToWishListRequest } from '@/types/wishlist';
import { useAuth } from '@/hooks/useAuth';
import { showSuccess, showError } from '@/lib/toast';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardDetails } from '@/types/card';
import { WishlistContext } from './WishlistContext';

interface WishlistProviderProps {
    children: React.ReactNode;
}

/**
 * Proveedor para el contexto de listas de deseos
 */
export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
    const [userWishlists, setUserWishlists] = useState<WishList[]>([]);
    const [selectedWishlist, setSelectedWishlist] = useState<WishList | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [enrichedCards, setEnrichedCards] = useState<Record<string, EnrichedWishListCard[]>>({});
    
    const { user } = useAuth();
    
    // Cargar las listas de deseos del usuario
    const loadWishlists = useCallback(async () => {
        if (!user) {
            setUserWishlists([]);
            setSelectedWishlist(null);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            // Consultar las listas de deseos del usuario
            const wishlistsCollectionRef = collection(db, 'wishlists');
            const q = query(wishlistsCollectionRef, where("userId", "==", user.id));
            const querySnapshot = await getDocs(q);
            
            const lists: WishList[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                lists.push({
                    id: doc.id,
                    userId: data.userId,
                    name: data.name,
                    description: data.description,
                    isPublic: data.isPublic || false,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    imageUrl: data.imageUrl,
                    cardCount: data.cards?.length || 0,
                    cards: (data.cards || []).map((card: Record<string, unknown>) => ({
                        cardId: card.cardId as string,
                        addedAt: (card.addedAt as Timestamp)?.toDate() || new Date(),
                        notes: card.notes as string | undefined,
                        priority: card.priority as WishListPriority || WishListPriority.MEDIUM
                    }))
                });
            });
            
            setUserWishlists(lists);
            
            // Si hay listas, seleccionar la primera por defecto
            if (lists.length > 0 && !selectedWishlist) {
                setSelectedWishlist(lists[0]);
                // Cargar los detalles de las cartas para la primera lista
                await loadCardDetails(lists[0].id, lists[0].cards);
            }
            
            console.log(`Cargadas ${lists.length} listas de deseos`);
        } catch (err) {
            console.error('Error loading wishlists:', err);
            setError('Error al cargar las listas de deseos');
            showError("No se pudieron cargar tus listas de deseos.");
        } finally {
            setLoading(false);
        }
    }, [user, selectedWishlist]);
    
    // Cargar los detalles de las cartas para una lista específica
    const loadCardDetails = async (wishlistId: string, cards: WishListCard[]) => {
        if (cards.length === 0) {
            setEnrichedCards(prev => ({
                ...prev,
                [wishlistId]: []
            }));
            return [];
        }
        
        try {
            // Obtener los IDs de todas las cartas en la lista
            const cardIds = cards.map(card => card.cardId);
            
            // Dividir en lotes si hay muchas cartas (límite de Firestore)
            const batchSize = 10;
            const enrichedCardsList: EnrichedWishListCard[] = [];
            
            for (let i = 0; i < cardIds.length; i += batchSize) {
                const batch = cardIds.slice(i, i + batchSize);
                
                // Consultar detalles de las cartas en este lote
                const cardsCollectionRef = collection(db, 'cards');
                const querySnapshot = await getDocs(query(cardsCollectionRef, where('__name__', 'in', batch)));
                
                const cardDetails: Record<string, Card> = {};
                querySnapshot.forEach(doc => {
                    cardDetails[doc.id] = { id: doc.id, ...doc.data() } as Card;
                });
                
                // Combinar con los datos de la lista de deseos
                const batchEnrichedCards = batch
                    .filter(cardId => cardDetails[cardId]) // Filtrar cartas que no existen
                    .map(cardId => {
                        const wishlistData = cards.find(c => c.cardId === cardId)!;
                        // Nos aseguramos que tenga un id no opcional
                        const cardDetail: CardDetails = {
                            ...cardDetails[cardId],
                            id: cardId // Garantizamos que id sea obligatorio
                        };
                        
                        return {
                            wishlistData,
                            cardDetails: cardDetail
                        };
                    });
                
                enrichedCardsList.push(...batchEnrichedCards);
            }
            
            // Almacenar los datos enriquecidos
            setEnrichedCards(prev => ({
                ...prev,
                [wishlistId]: enrichedCardsList
            }));
            
            return enrichedCardsList;
        } catch (error) {
            console.error('Error al cargar detalles de cartas:', error);
            showError("No se pudieron cargar los detalles de las cartas.");
            return [];
        }
    };
    
    // Función para acceder a los datos enriquecidos de cartas
    const getEnrichedCards = async (wishlistId: string): Promise<EnrichedWishListCard[]> => {
        // Si ya tenemos los datos cargados, devolverlos
        if (enrichedCards[wishlistId]) {
            return enrichedCards[wishlistId];
        }
        
        // Si no, buscar la lista y cargar los datos
        const wishlist = userWishlists.find(list => list.id === wishlistId);
        if (!wishlist) {
            return [];
        }
        
        return await loadCardDetails(wishlistId, wishlist.cards);
    };
    
    // Cargar las listas cuando cambie el usuario
    useEffect(() => {
        loadWishlists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);
    
    // Refrescar las listas
    const refreshWishlists = useCallback(async () => {
        await loadWishlists();
    }, [loadWishlists]);
    
    // Seleccionar una lista
    const selectWishlist = async (id: string) => {
        const wishlist = userWishlists.find(list => list.id === id);
        if (wishlist) {
            setSelectedWishlist(wishlist);
            await getEnrichedCards(id);
        }
    };
    
    // Crear una nueva lista de deseos
    const createWishlist = useCallback(async (name: string, description?: string, isPublic: boolean = false): Promise<string> => {
        if (!user) {
            throw new Error('Debes iniciar sesión para crear una lista');
        }
        
        try {
            setLoading(true);
            
            // Generar ID único
            const id = uuidv4();
            
            // Crear la nueva lista
            const newWishlist: WishList = {
                id,
                userId: user.id,
                name,
                description,
                isPublic,
                createdAt: new Date(),
                updatedAt: new Date(),
                cardCount: 0,
                cards: []
            };
            
            // Guardar en Firestore
            await setDoc(doc(db, 'wishlists', id), {
                userId: user.id,
                name,
                description,
                isPublic,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                cards: []
            });
            
            // Actualizar estado local
            setUserWishlists(prev => [...prev, newWishlist]);
            
            // Seleccionar la nueva lista
            setSelectedWishlist(newWishlist);
            
            showSuccess("Tu lista ha sido creada correctamente.");
            
            return id;
        } catch (error) {
            console.error('Error al crear lista:', error);
            showError("No se pudo crear la lista. Inténtalo de nuevo.");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user]);
    
    // Actualizar una lista de deseos
    const updateWishlist = useCallback(async (id: string, data: Partial<WishList>): Promise<void> => {
        if (!user) {
            throw new Error('Debes iniciar sesión para actualizar una lista');
        }
        
        try {
            setLoading(true);
            
            // Actualizar en Firestore
            const wishlistRef = doc(db, 'wishlists', id);
            await updateDoc(wishlistRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            
            // Actualizar estado local
            setUserWishlists(prev => 
                prev.map(list => 
                    list.id === id 
                        ? { ...list, ...data, updatedAt: new Date() } 
                        : list
                )
            );
            
            // Actualizar lista seleccionada si es necesario
            if (selectedWishlist?.id === id) {
                setSelectedWishlist(prev => 
                    prev ? { ...prev, ...data, updatedAt: new Date() } : null
                );
            }
            
            showSuccess("Los cambios han sido guardados.");
        } catch (error) {
            console.error('Error al actualizar lista:', error);
            showError("No se pudo actualizar la lista. Inténtalo de nuevo.");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, selectedWishlist]);
    
    // Eliminar una lista de deseos
    const deleteWishlist = useCallback(async (id: string): Promise<void> => {
        if (!user) {
            throw new Error('Debes iniciar sesión para eliminar una lista');
        }
        
        try {
            setLoading(true);
            
            // Eliminar de Firestore
            await deleteDoc(doc(db, 'wishlists', id));
            
            // Eliminar del estado local
            setUserWishlists(prev => prev.filter(list => list.id !== id));
            
            // Si era la lista seleccionada, seleccionar otra
            if (selectedWishlist?.id === id) {
                const nextList = userWishlists.find(list => list.id !== id);
                setSelectedWishlist(nextList || null);
            }
            
            showSuccess("La lista ha sido eliminada correctamente.");
        } catch (error) {
            console.error('Error al eliminar lista:', error);
            showError("No se pudo eliminar la lista. Inténtalo de nuevo.");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, selectedWishlist, userWishlists]);
    
    // Agregar una carta a una lista de deseos
    const addCardToWishlist = useCallback(async (request: AddToWishListRequest): Promise<void> => {
        if (!user) {
            throw new Error('Debes iniciar sesión para agregar cartas a una lista');
        }
        
        try {
            setLoading(true);
            
            const { wishlistId, cardId, priority, notes } = request;
            
            // Verificar si la carta ya está en la lista
            const wishlist = userWishlists.find(list => list.id === wishlistId);
            if (wishlist && wishlist.cards.some(card => card.cardId === cardId)) {
                showError("Esta carta ya está en la lista de deseos.");
                return;
            }
            
            // Actualizar en Firestore
            const wishlistRef = doc(db, 'wishlists', wishlistId);
            
            // Crear objeto con solo campos válidos para Firestore (sin valores undefined)
            const cardForFirestore = {
                cardId,
                addedAt: Timestamp.now(),
                priority: priority || WishListPriority.MEDIUM,
                // Solo incluir notes si no es undefined
                ...(notes !== undefined && { notes })
            };
            
            await updateDoc(wishlistRef, {
                cards: arrayUnion(cardForFirestore),
                updatedAt: serverTimestamp()
            });
            
            // Para el estado local creamos un objeto con Date para React
            const cardForState: WishListCard = {
                cardId,
                addedAt: new Date(),
                priority: priority || WishListPriority.MEDIUM,
                ...(notes !== undefined && { notes })
            };
            
            // Actualizar estado local
            setUserWishlists(prev => 
                prev.map(list => {
                    if (list.id === wishlistId) {
                        return {
                            ...list,
                            cards: [...list.cards, cardForState],
                            cardCount: list.cardCount + 1,
                            updatedAt: new Date()
                        };
                    }
                    return list;
                })
            );
            
            // Actualizar lista seleccionada si es necesario
            if (selectedWishlist?.id === wishlistId) {
                setSelectedWishlist(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        cards: [...prev.cards, cardForState],
                        cardCount: prev.cardCount + 1,
                        updatedAt: new Date()
                    };
                });
                
                // Cargar los detalles de la carta
                const cardDoc = await getDoc(doc(db, 'cards', cardId));
                if (cardDoc.exists()) {
                    const cardData = { id: cardDoc.id, ...cardDoc.data() } as CardDetails;
                    
                    setEnrichedCards(prev => {
                        const currentCards = prev[wishlistId] || [];
                        return {
                            ...prev,
                            [wishlistId]: [
                                ...currentCards,
                                {
                                    wishlistData: {
                                        cardId,
                                        addedAt: new Date(),
                                        priority: priority || WishListPriority.MEDIUM,
                                        ...(notes !== undefined && { notes })
                                    },
                                    cardDetails: cardData
                                }
                            ]
                        };
                    });
                }
            }
            
            showSuccess("La carta ha sido agregada a tu lista de deseos.");
        } catch (error) {
            console.error('Error al agregar carta a lista:', error);
            showError("No se pudo agregar la carta a la lista. Inténtalo de nuevo.");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, selectedWishlist, userWishlists]);
    
    // Eliminar una carta de una lista de deseos
    const removeCardFromWishlist = useCallback(async (wishlistId: string, cardId: string): Promise<void> => {
        if (!user) {
            throw new Error('Debes iniciar sesión para eliminar cartas de una lista');
        }
        
        try {
            setLoading(true);
            
            // Buscar la carta en la lista
            const wishlist = userWishlists.find(list => list.id === wishlistId);
            if (!wishlist) {
                throw new Error('Lista no encontrada');
            }
            
            const cardToRemove = wishlist.cards.find(card => card.cardId === cardId);
            if (!cardToRemove) {
                throw new Error('Carta no encontrada en la lista');
            }
            
            // Actualizar en Firestore - este método es complejo porque arrayRemove necesita el objeto exacto
            // Primero obtenemos la lista actual
            const wishlistDoc = await getDoc(doc(db, 'wishlists', wishlistId));
            if (!wishlistDoc.exists()) {
                throw new Error('Lista no encontrada en Firestore');
            }
            
            const wishlistData = wishlistDoc.data();
            const currentCards = wishlistData.cards || [];
            
            // Filtrar la carta que queremos eliminar
            const updatedCards = currentCards.filter((card: Record<string, unknown>) => card.cardId !== cardId);
            
            // Actualizar con el nuevo array
            await updateDoc(doc(db, 'wishlists', wishlistId), {
                cards: updatedCards,
                updatedAt: serverTimestamp()
            });
            
            // Actualizar estado local
            setUserWishlists(prev => 
                prev.map(list => {
                    if (list.id === wishlistId) {
                        return {
                            ...list,
                            cards: list.cards.filter(card => card.cardId !== cardId),
                            cardCount: list.cardCount - 1,
                            updatedAt: new Date()
                        };
                    }
                    return list;
                })
            );
            
            // Actualizar lista seleccionada si es necesario
            if (selectedWishlist?.id === wishlistId) {
                setSelectedWishlist(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        cards: prev.cards.filter(card => card.cardId !== cardId),
                        cardCount: prev.cardCount - 1,
                        updatedAt: new Date()
                    };
                });
                
                // Actualizar cartas enriquecidas
                setEnrichedCards(prev => {
                    const currentCards = prev[wishlistId] || [];
                    return {
                        ...prev,
                        [wishlistId]: currentCards.filter(card => card.wishlistData.cardId !== cardId)
                    };
                });
            }
            
            showSuccess("La carta ha sido eliminada de tu lista de deseos.");
        } catch (error) {
            console.error('Error al eliminar carta de lista:', error);
            showError("No se pudo eliminar la carta de la lista. Inténtalo de nuevo.");
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user, selectedWishlist, userWishlists]);
    
    // Actualizar una carta en una lista de deseos
    const updateCardInWishlist = async (wishlistId: string, cardId: string, data: Partial<WishListCard>) => {
        if (!user) {
            throw new Error('Debes iniciar sesión para actualizar cartas en una lista');
        }
        
        try {
            setLoading(true);
            
            // Buscar la lista y la carta
            const wishlist = userWishlists.find(list => list.id === wishlistId);
            if (!wishlist) {
                throw new Error('Lista no encontrada');
            }
            
            const cardIndex = wishlist.cards.findIndex(card => card.cardId === cardId);
            if (cardIndex === -1) {
                throw new Error('Carta no encontrada en la lista');
            }
            
            // Actualizar en Firestore - similar a removeCardFromWishlist, necesitamos reconstruir el array
            const wishlistDoc = await getDoc(doc(db, 'wishlists', wishlistId));
            if (!wishlistDoc.exists()) {
                throw new Error('Lista no encontrada en Firestore');
            }
            
            const wishlistData = wishlistDoc.data();
            const currentCards = wishlistData.cards || [];
            
            // Crear el nuevo array de cartas con la actualización
            const updatedCards = currentCards.map((card: Record<string, unknown>) => {
                if (card.cardId === cardId) {
                    return {
                        ...card,
                        ...data
                    };
                }
                return card;
            });
            
            // Actualizar en Firestore
            await updateDoc(doc(db, 'wishlists', wishlistId), {
                cards: updatedCards,
                updatedAt: serverTimestamp()
            });
            
            // Actualizar estado local
            setUserWishlists(prev => 
                prev.map(list => {
                    if (list.id === wishlistId) {
                        const updatedCards = list.cards.map(card => {
                            if (card.cardId === cardId) {
                                return {
                                    ...card,
                                    ...data
                                };
                            }
                            return card;
                        });
                        
                        return {
                            ...list,
                            cards: updatedCards,
                            updatedAt: new Date()
                        };
                    }
                    return list;
                })
            );
            
            // Actualizar lista seleccionada si es necesario
            if (selectedWishlist?.id === wishlistId) {
                setSelectedWishlist(prev => {
                    if (!prev) return null;
                    
                    const updatedCards = prev.cards.map(card => {
                        if (card.cardId === cardId) {
                            return {
                                ...card,
                                ...data
                            };
                        }
                        return card;
                    });
                    
                    return {
                        ...prev,
                        cards: updatedCards,
                        updatedAt: new Date()
                    };
                });
                
                // Actualizar cartas enriquecidas
                setEnrichedCards(prev => {
                    const currentCards = prev[wishlistId] || [];
                    return {
                        ...prev,
                        [wishlistId]: currentCards.map(card => {
                            if (card.wishlistData.cardId === cardId) {
                                return {
                                    ...card,
                                    wishlistData: {
                                        ...card.wishlistData,
                                        ...data
                                    }
                                };
                            }
                            return card;
                        })
                    };
                });
            }
            
            showSuccess("Los cambios han sido guardados.");
        } catch (error) {
            console.error('Error al actualizar carta en lista:', error);
            showError("No se pudo actualizar la carta. Inténtalo de nuevo.");
            throw error;
        } finally {
            setLoading(false);
        }
    };
    
    // Verificar si una carta está en alguna lista de deseos
    const isCardInWishlists = (cardId: string) => {
        const wishlists = userWishlists.filter(list => 
            list.cards.some(card => card.cardId === cardId)
        ).map(list => list.id);
        
        return {
            inWishlist: wishlists.length > 0,
            wishlists
        };
    };
    
    const contextValue = {
        userWishlists,
        selectedWishlist,
        enrichedCards,
        loading,
        error,
        createWishlist,
        updateWishlist,
        deleteWishlist,
        selectWishlist,
        addCardToWishlist,
        removeCardFromWishlist,
        updateCardInWishlist,
        isCardInWishlists,
        getEnrichedCards,
        refreshWishlists
    };

    return (
        <WishlistContext.Provider value={contextValue}>
            {children}
        </WishlistContext.Provider>
    );
}; 