import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logError } from '@/lib/error-handler';
import { 
    AnalyticsData, 
    DeckStats, 
    CardDistribution, 
    EnergyDistribution, 
    TopCard,
    TopStarterCards,
    TopCardsByType
} from '@/types/analytics';
import { Deck, DeckWithCards } from '@/types/deck';
import { CardDetails, CardEnergy } from '@/types/card';
import { getCardsByIds } from './cardService';
import { cacheService } from '@/lib/cache-service';

// Nombre de la colección en Firestore
const COLLECTION_NAME = 'decks';

// TTL para la caché (30 minutos para analytics)
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Convierte un documento de Firestore en un objeto Deck
 */
function convertFirestoreDocToDeck(docSnapshot: any): Deck {
    const data = docSnapshot.data();
    return {
        id: docSnapshot.id,
        name: data.name || 'Mazo sin nombre',
        userUid: data.userUid,
        userName: data.userName,
        userAvatar: data.userAvatar,
        cardIds: data.cardIds || [],
        deckSlots: data.deckSlots || [],
        isPublic: data.isPublic || false,
        description: data.description || '',
        likes: data.likes || 0,
        views: data.views || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    };
}

/**
 * Crea un objeto de analytics vacío para cuando no hay datos
 */
function createEmptyAnalyticsData(): AnalyticsData {
    const emptyTopCards: TopCardsByType = {
        cards: [],
        totalDecksAnalyzed: 0
    };

    return {
        deckStats: {
            totalDecks: 0,
            publicDecks: 0,
            privateDecks: 0
        },
        cardDistribution: {
            avgCardsPerDeck: 0,
            minCardsPerDeck: 0,
            maxCardsPerDeck: 0,
            totalCardsInDecks: 0
        },
        energyDistribution: {},
        topCards: [],
        topStarterCards: {
            cards: [],
            totalDecksAnalyzed: 0
        },
        topProtectorCards: emptyTopCards,
        topBioCards: emptyTopCards,
        topRotCards: emptyTopCards,
        topIximCards: emptyTopCards,
        topRavaCards: emptyTopCards,
        topEspectroCards: emptyTopCards,
        topAdendeiCards: emptyTopCards,
        lastUpdated: new Date().toISOString()
    };
}

/**
 * Obtiene todas las estadísticas de analytics para decks
 * Usa una estrategia diferente basada en el rol del usuario
 */
export const getAnalyticsData = async (): Promise<AnalyticsData> => {
    const cacheKey = 'analytics:deck-data';

    return cacheService.getOrFetch(cacheKey, async () => {
        try {
            console.log('🔍 Obteniendo datos para analytics...');
            
            // Intentar obtener todos los decks (solo funciona para admin o modo emulador)
            let decks: Deck[] = [];
            
            try {
                // Primero intentar obtener todos los decks (funciona para admin)
                const decksCol = collection(db, COLLECTION_NAME);
                const decksQuery = query(decksCol, orderBy('createdAt', 'desc'));
                const decksSnapshot = await getDocs(decksQuery);
                
                decks = decksSnapshot.docs.map(doc => convertFirestoreDocToDeck(doc));
                console.log(`📊 Obtenidos ${decks.length} decks directamente`);
            } catch (adminError) {
                console.log('❌ No se pueden obtener todos los decks, obteniendo solo públicos...');
                
                // Si falla, obtener solo decks públicos
                try {
                    const decksCol = collection(db, COLLECTION_NAME);
                    const publicDecksQuery = query(
                        decksCol, 
                        where('isPublic', '==', true),
                        orderBy('createdAt', 'desc')
                    );
                    const publicDecksSnapshot = await getDocs(publicDecksQuery);
                    
                    decks = publicDecksSnapshot.docs.map(doc => convertFirestoreDocToDeck(doc));
                    console.log(`📊 Obtenidos ${decks.length} decks públicos`);
                } catch (publicError) {
                    console.warn('⚠️ No se pudieron obtener decks públicos:', publicError);
                    throw new Error('No se pudieron obtener datos de decks. Verifica los permisos.');
                }
            }

            if (decks.length === 0) {
                console.warn('⚠️ No se encontraron decks para analizar');
                return createEmptyAnalyticsData();
            }

            console.log(`📊 Procesando ${decks.length} decks para analytics`);

            // Calcular estadísticas básicas de decks
            const deckStats = calculateDeckStats(decks);
            
            // Calcular distribución de cartas
            const cardDistribution = calculateCardDistribution(decks);
            
            // Obtener todos los IDs únicos de cartas y sus detalles
            const allCardIds = [...new Set(decks.flatMap(deck => deck.cardIds))];
            const cardDetails = await getCardsByIds(allCardIds);
            const cardDetailsMap = new Map(cardDetails.map(card => [card.id, card]));
            
            // Calcular distribución por energía
            const energyDistribution = calculateEnergyDistribution(decks, cardDetailsMap);
            
            // Calcular top cartas más utilizadas
            const topCards = calculateTopCards(decks, cardDetailsMap);
            
            // Calcular top cartas de inicio
            const topStarterCards = calculateTopStarterCards(decks, cardDetailsMap);
            
            // Calcular top cartas por tipo
            const topProtectorCards = calculateTopCardsByType(decks, cardDetailsMap, 'protector');
            const topBioCards = calculateTopCardsByType(decks, cardDetailsMap, 'bio');
            const topRotCards = calculateTopCardsByType(decks, cardDetailsMap, 'rot');
            const topIximCards = calculateTopCardsByType(decks, cardDetailsMap, 'ixim');
            const topRavaCards = calculateTopCardsByType(decks, cardDetailsMap, 'rava');
            const topEspectroCards = calculateTopCardsByType(decks, cardDetailsMap, 'espectro');
            const topAdendeiCards = calculateTopCardsByType(decks, cardDetailsMap, 'adendei');

            const analyticsData: AnalyticsData = {
                deckStats,
                cardDistribution,
                energyDistribution,
                topCards,
                topStarterCards,
                topProtectorCards,
                topBioCards,
                topRotCards,
                topIximCards,
                topRavaCards,
                topEspectroCards,
                topAdendeiCards,
                lastUpdated: new Date().toISOString()
            };

            console.log('✅ Analytics data calculada exitosamente');
            return analyticsData;

        } catch (error) {
            console.error('Error al obtener analytics data:', error);
            logError(error);
            throw error;
        }
    }, CACHE_TTL);
};

/**
 * Calcula estadísticas básicas de decks
 */
function calculateDeckStats(decks: Deck[]): DeckStats {
    const totalDecks = decks.length;
    const publicDecks = decks.filter(deck => deck.isPublic).length;
    const privateDecks = totalDecks - publicDecks;

    return {
        totalDecks,
        publicDecks,
        privateDecks
    };
}

/**
 * Calcula la distribución de cartas por deck
 */
function calculateCardDistribution(decks: Deck[]): CardDistribution {
    if (decks.length === 0) {
        return {
            avgCardsPerDeck: 0,
            minCardsPerDeck: 0,
            maxCardsPerDeck: 0,
            totalCardsInDecks: 0
        };
    }

    const cardCounts = decks.map(deck => deck.cardIds.length);
    const totalCardsInDecks = cardCounts.reduce((sum, count) => sum + count, 0);
    const avgCardsPerDeck = Math.round(totalCardsInDecks / decks.length * 10) / 10; // Redondear a 1 decimal
    const minCardsPerDeck = Math.min(...cardCounts);
    const maxCardsPerDeck = Math.max(...cardCounts);

    return {
        avgCardsPerDeck,
        minCardsPerDeck,
        maxCardsPerDeck,
        totalCardsInDecks
    };
}

/**
 * Calcula la distribución de cartas por energía
 */
function calculateEnergyDistribution(decks: Deck[], cardDetailsMap: Map<string, CardDetails>): EnergyDistribution {
    const energyCount = new Map<string, number>();
    let totalCards = 0;

    // Lista de tipos de cartas que NO tienen energy
    const cardsWithoutEnergy = ['protector', 'bio', 'rot', 'ixim', 'espectro'];

    // Contar todas las cartas por energía
    decks.forEach(deck => {
        deck.cardIds.forEach(cardId => {
            const card = cardDetailsMap.get(cardId);
            if (card) {
                // Si es una carta que no debería tener energy, saltarla
                if (cardsWithoutEnergy.includes(card.type || '')) {
                    return;
                }
                
                // Para cartas que deberían tener energy
                const energy = card.energy || 'Sin Energía'; // Fallback para cartas sin energy definida
                const currentCount = energyCount.get(energy) || 0;
                energyCount.set(energy, currentCount + 1);
                totalCards++;
            }
        });
    });

    // Convertir a objeto con porcentajes
    const distribution: EnergyDistribution = {};
    energyCount.forEach((count, energy) => {
        distribution[energy] = {
            energy: energy as CardEnergy,
            count,
            percentage: Math.round((count / totalCards) * 100 * 10) / 10 // Redondear a 1 decimal
        };
    });

    return distribution;
}

/**
 * Calcula las cartas más utilizadas en todos los decks
 */
function calculateTopCards(decks: Deck[], cardDetailsMap: Map<string, CardDetails>): TopCard[] {
    const cardCount = new Map<string, number>();
    let totalCardInstances = 0;

    // Lista de tipos de cartas que NO deben aparecer en el top general
    const excludedCardTypes = ['protector', 'bio', 'rot', 'ixim', 'espectro'];

    // Contar todas las instancias de cartas (excluyendo tipos específicos)
    decks.forEach(deck => {
        deck.cardIds.forEach(cardId => {
            const card = cardDetailsMap.get(cardId);
            // Solo contar cartas que no sean de tipos específicos
            if (card && !excludedCardTypes.includes(card.type || '')) {
                const currentCount = cardCount.get(cardId) || 0;
                cardCount.set(cardId, currentCount + 1);
                totalCardInstances++;
            }
        });
    });

    // Convertir a array y ordenar por uso
    const topCardsArray: TopCard[] = Array.from(cardCount.entries())
        .map(([cardId, count]) => {
            const card = cardDetailsMap.get(cardId);
            return {
                cardId,
                name: card?.name || 'Carta desconocida',
                imageUrl: card?.imageUrl || '',
                count,
                percentage: Math.round((count / totalCardInstances) * 100 * 10) / 10,
                energy: card?.energy,
                type: card?.type
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, Math.min(10, cardCount.size)); // Top dinámico hasta 10

    return topCardsArray;
}

/**
 * Calcula las cartas más utilizadas en las primeras 3 posiciones de los decks
 */
function calculateTopStarterCards(decks: Deck[], cardDetailsMap: Map<string, CardDetails>): TopStarterCards {
    const starterCardCount = new Map<string, number>();
    let totalStarterInstances = 0;
    let decksAnalyzed = 0;

    // Contar las primeras 3 cartas de cada deck
    decks.forEach(deck => {
        if (deck.deckSlots && deck.deckSlots.length >= 3) {
            // Si hay slots organizados, usar las primeras 3 posiciones
            const sortedSlots = deck.deckSlots.sort((a, b) => {
                if (a.row !== b.row) return a.row - b.row;
                return a.col - b.col;
            });
            
            const starterCards = sortedSlots.slice(0, 3);
            starterCards.forEach(slot => {
                const currentCount = starterCardCount.get(slot.cardId) || 0;
                starterCardCount.set(slot.cardId, currentCount + 1);
                totalStarterInstances++;
            });
            decksAnalyzed++;
        } else if (deck.cardIds && deck.cardIds.length >= 3) {
            // Si no hay slots, usar las primeras 3 cartas del array
            const starterCards = deck.cardIds.slice(0, 3);
            starterCards.forEach(cardId => {
                const currentCount = starterCardCount.get(cardId) || 0;
                starterCardCount.set(cardId, currentCount + 1);
                totalStarterInstances++;
            });
            decksAnalyzed++;
        }
    });

    // Convertir a array y ordenar por uso
    const topStarterCardsArray: TopCard[] = Array.from(starterCardCount.entries())
        .map(([cardId, count]) => {
            const card = cardDetailsMap.get(cardId);
            return {
                cardId,
                name: card?.name || 'Carta desconocida',
                imageUrl: card?.imageUrl || '',
                count,
                percentage: totalStarterInstances > 0 ? Math.round((count / totalStarterInstances) * 100 * 10) / 10 : 0,
                energy: card?.energy,
                type: card?.type
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, Math.min(10, starterCardCount.size)); // Top dinámico hasta 10

    return {
        cards: topStarterCardsArray,
        totalDecksAnalyzed: decksAnalyzed
    };
}

/**
 * Calcula los top cards más utilizados de un tipo específico
 */
function calculateTopCardsByType(decks: Deck[], cardDetailsMap: Map<string, CardDetails>, cardType: string): TopCardsByType {
    const cardCount = new Map<string, number>();
    let totalCardInstances = 0;
    let decksAnalyzed = 0;

    // Contar todas las instancias de cartas del tipo específico
    decks.forEach(deck => {
        let hasCardOfType = false;
        deck.cardIds.forEach(cardId => {
            const card = cardDetailsMap.get(cardId);
            if (card && card.type === cardType) {
                const currentCount = cardCount.get(cardId) || 0;
                cardCount.set(cardId, currentCount + 1);
                totalCardInstances++;
                hasCardOfType = true;
            }
        });
        
        if (hasCardOfType) {
            decksAnalyzed++;
        }
    });

    // Convertir a array y ordenar por uso
    const topCardsArray: TopCard[] = Array.from(cardCount.entries())
        .map(([cardId, count]) => {
            const card = cardDetailsMap.get(cardId);
            return {
                cardId,
                name: card?.name || 'Carta desconocida',
                imageUrl: card?.imageUrl || '',
                count,
                percentage: totalCardInstances > 0 ? Math.round((count / totalCardInstances) * 100 * 10) / 10 : 0,
                energy: card?.energy,
                type: card?.type
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, Math.min(10, cardCount.size)); // Top dinámico hasta 10

    return {
        cards: topCardsArray,
        totalDecksAnalyzed: decksAnalyzed
    };
}

/**
 * Limpia la caché de analytics (útil para refrescar datos)
 */
export const clearAnalyticsCache = (): void => {
    cacheService.delete('analytics:deck-data');
};