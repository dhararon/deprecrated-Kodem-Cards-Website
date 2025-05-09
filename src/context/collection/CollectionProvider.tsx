import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardDetails, CardSet } from '@/types/card';
import { CardWithQuantity, ProcessedCollection } from '@/types/collection';
import { useAuth } from '@/hooks/useAuth';
import { CollectionContext } from './CollectionContext';

interface CollectionProviderProps {
    children: ReactNode;
}

const CollectionProvider: React.FC<CollectionProviderProps> = ({ children }) => {
    const [userCollection, setUserCollection] = useState<ProcessedCollection>({
        cards: [],
        cardsBySet: {},
        cardsByRarity: {},
        totalCards: 0,
        totalUniqueCards: 0
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    // Cargar la colección del usuario cuando el usuario cambia
    const loadCollection = useCallback(async () => {
        if (!user) {
            setUserCollection({
                cards: [],
                cardsBySet: {},
                cardsByRarity: {},
                totalCards: 0,
                totalUniqueCards: 0
            });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // 1. Cargar todas las cartas disponibles
            const cardsCollectionRef = collection(db, 'cards');
            const q = query(cardsCollectionRef);
            const querySnapshot = await getDocs(q);

            const cards: Card[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                cards.push({ id: doc.id, ...data } as Card);
            });

            console.log(`Cargadas ${cards.length} cartas del catálogo`);

            // 2. Cargar la colección del usuario (cantidades de cada carta)
            const userCollectionRef = doc(db, 'user_collections', user.id);
            const userCollectionDoc = await getDoc(userCollectionRef);

            let userCards: Record<string, { quantity: number, updatedAt?: unknown }> = {};

            if (userCollectionDoc.exists()) {
                const userData = userCollectionDoc.data();
                userCards = userData.cards || {};
                console.log(`Colección del usuario cargada: ${Object.keys(userCards).length} cartas`);
            } else {
                console.log('El usuario no tiene colección guardada todavía');
            }

            // 3. Combinar los datos: asignar cantidades a las cartas del catálogo
            const enrichedCards = cards.map(card => {
                const userCardData = userCards[card.id];
                const quantity = userCardData ? userCardData.quantity : 0;

                return {
                    ...card,
                    quantity,
                    inCollection: quantity > 0
                };
            });

            // 4. Procesar los datos combinados
            const processed = processCollectionData(enrichedCards);
            setUserCollection(processed);

            console.log('Colección cargada y procesada exitosamente');
        } catch (err) {
            console.error('Error loading collection:', err);
            setError('Error al cargar la colección');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const refreshCollection = async () => {
        await loadCollection();
    };

    useEffect(() => {
        loadCollection();
    }, [user, loadCollection]);

    // Función para procesar los datos de la colección
    const processCollectionData = (cards: Card[]): ProcessedCollection => {
        const processedCards: CardWithQuantity[] = cards.map(card => {
            // Normalizar la propiedad cardSet desde setName si existe
            if ((card as { setName?: string }).setName && !card.cardSet) {
                const setName = (card as { setName?: string }).setName;

                // Intentar mapear el setName a un valor de CardSet
                let matchedSet: CardSet | undefined;
                Object.values(CardSet).forEach(enumSetName => {
                    if (setName?.toLowerCase() === enumSetName.toLowerCase()) {
                        matchedSet = enumSetName;
                    }
                });

                // Asignar el set correspondiente o el primero por defecto
                card.cardSet = matchedSet || Object.values(CardSet)[0];
            }

            // Preservar los datos de cantidad e inCollection que ya vienen en la carta
            // o usar valores por defecto si no existen
            const quantity = (card as { quantity?: number }).quantity !== undefined 
                ? (card as { quantity?: number }).quantity 
                : 0;
            const inCollection = (card as { inCollection?: boolean }).inCollection !== undefined 
                ? (card as { inCollection?: boolean }).inCollection 
                : false;

            return {
                mainCard: {
                    ...card as CardDetails,
                    quantity: quantity || 0,
                    inCollection: inCollection || false
                }
            };
        });

        console.log('Procesando colección:', cards.length, 'cartas');

        // Depurar los sets disponibles en el enum
        console.log('Sets disponibles en el enum:', Object.values(CardSet));

        // Contar cuántas cartas tienen quantity > 0
        const cardsInCollection = processedCards.filter(card => card.mainCard.quantity > 0);
        console.log(`Cartas en la colección del usuario: ${cardsInCollection.length} de ${processedCards.length}`);

        // Agrupar por set
        const cardsBySet: { [key: string]: CardWithQuantity[] } = {};

        // Inicializar con todos los sets del enum
        Object.values(CardSet).forEach(setName => {
            cardsBySet[setName] = [];
        });

        // Ahora procesar las cartas
        processedCards.forEach(cardGroup => {
            // Verificar que el set sea un valor válido del enum CardSet
            const cardSetValue = cardGroup.mainCard.cardSet;

            // Usar el valor del cardSet si está definido y es válido, sino usar el primer valor del enum
            let set: string;

            if (cardSetValue && Object.values(CardSet).includes(cardSetValue)) {
                set = cardSetValue;
            } else {
                set = Object.values(CardSet)[0]; // Usar el primer set por defecto
                console.warn(`Carta con set inválido (${cardSetValue}), asignada a ${set}:`, cardGroup.mainCard.name);

                // Asignar el set correcto a la carta también
                cardGroup.mainCard.cardSet = set as CardSet;
            }

            // Asegurarse de que el arreglo exista
            if (!cardsBySet[set]) {
                cardsBySet[set] = [];
            }

            cardsBySet[set].push(cardGroup);
        });

        // Agrupar por rareza (mantener para compatibilidad)
        const cardsByRarity: { [key: string]: CardWithQuantity[] } = {};

        // Total de cartas únicas y total de cartas (incluyendo duplicados)
        const totalUniqueCards = processedCards.length;
        const totalCards = processedCards.reduce((total, card) => total + (card.mainCard.quantity || 0), 0);

        return {
            cards: processedCards,
            cardsBySet,
            cardsByRarity,
            totalCards,
            totalUniqueCards
        };
    };

    const isCardInCollection = (cardId: string): boolean => {
        const card = userCollection.cards.find(c => c.mainCard.id === cardId);
        return card ? (card.mainCard.quantity || 0) > 0 : false;
    };

    const getCardQuantity = (cardId: string): number => {
        const card = userCollection.cards.find(c => c.mainCard.id === cardId);
        return card ? (card.mainCard.quantity || 0) : 0;
    };

    const updateCardQuantity = async (cardId: string, quantity: number) => {
        if (!user) return;

        try {
            const userCollectionRef = doc(db, 'user_collections', user.id);
            
            // Verificar si el documento existe
            const userCollectionDoc = await getDoc(userCollectionRef);
            
            if (userCollectionDoc.exists()) {
                // Actualizar el documento existente
                await updateDoc(userCollectionRef, {
                    [`cards.${cardId}.quantity`]: quantity,
                    [`cards.${cardId}.updatedAt`]: serverTimestamp()
                });
            } else {
                // Crear un nuevo documento con la estructura correcta
                await updateDoc(userCollectionRef, {
                    cards: {
                        [cardId]: {
                            quantity,
                            updatedAt: serverTimestamp()
                        }
                    },
                    userId: user.id,
                    updatedAt: serverTimestamp()
                });
            }
            
            // Actualizar el estado local
            setUserCollection(prevCollection => {
                // Encontrar la carta en la colección actual
                const updatedCards = prevCollection.cards.map(cardGroup => {
                    if (cardGroup.mainCard.id === cardId) {
                        return {
                            ...cardGroup,
                            mainCard: {
                                ...cardGroup.mainCard,
                                quantity,
                                inCollection: quantity > 0
                            }
                        };
                    }
                    return cardGroup;
                });
                
                // Recalcular los datos procesados
                return processCollectionData(
                    updatedCards.map(card => ({ 
                        ...card.mainCard,
                        // Estas propiedades se requieren para el procesamiento
                        quantity: card.mainCard.quantity,
                        inCollection: card.mainCard.inCollection 
                    }))
                );
            });
            
            console.log(`Carta ${cardId} actualizada a cantidad ${quantity}`);
        } catch (error) {
            console.error('Error al actualizar la cantidad de la carta:', error);
            setError('Error al actualizar la colección');
        }
    };

    // Utilizamos useEffect con una dependencia vacía para calcular las relaciones de datos
    useEffect(() => {
        // Esto se ejecuta solo cuando el componente se monta,
        // sirve para configurar listeners o suscripciones
    }, []);

    return (
        <CollectionContext.Provider
            value={{
                userCollection,
                loading,
                error,
                refreshCollection,
                isCardInCollection,
                getCardQuantity,
                updateCardQuantity
            }}
        >
            {children}
        </CollectionContext.Provider>
    );
};

export default CollectionProvider; 