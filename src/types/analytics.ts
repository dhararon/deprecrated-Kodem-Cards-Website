import { CardEnergy } from './card';

/**
 * Tipos para las métricas de analytics de decks
 */

export interface DeckStats {
    totalDecks: number;
    publicDecks: number;
    privateDecks: number;
}

export interface CardDistribution {
    avgCardsPerDeck: number;
    minCardsPerDeck: number;
    maxCardsPerDeck: number;
    totalCardsInDecks: number;
}

export interface EnergyDistribution {
    [key: string]: {
        energy: CardEnergy;
        count: number;
        percentage: number;
    };
}

export interface TopCard {
    cardId: string;
    name: string;
    imageUrl: string;
    count: number;
    percentage: number;
    energy?: CardEnergy;
    type?: string;
}

export interface TopStarterCards {
    cards: TopCard[];
    totalDecksAnalyzed: number;
}

export interface AnalyticsData {
    deckStats: DeckStats;
    cardDistribution: CardDistribution;
    energyDistribution: EnergyDistribution;
    topCards: TopCard[];
    topStarterCards: TopStarterCards;
    lastUpdated: string;
}