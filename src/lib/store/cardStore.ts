import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { createSelector } from './selectors';
import { produce } from 'immer';
import { CardDetails } from '@/types/card';

// Definiciones de tipos para cartas
export interface CardItem {
    id: string;
    name: string;
    imageUrl?: string;
    type?: string;
    cardType?: string;
    rarity?: string;
    description?: string;
    manaCost?: number;
    power?: number;
    defense?: number;
    element?: string;
    tcgType?: string;
    // TODO: Mejorar este tipo en el futuro para evitar el uso de 'any'
    // Se mantiene por compatibilidad con el código existente
    [key: string]: unknown;
}

// Interfaz para filtros de búsqueda
export interface CardSearchFilters {
    name: string;
    types: string[];
    rarities: string[];
    elements: string[];
    sets: string[];
    minPower?: number;
    maxPower?: number;
    minDefense?: number;
    maxDefense?: number;
    minManaCost?: number;
    maxManaCost?: number;
}

// Interfaz para las opciones de ordenamiento
export type SortOption = 'name' | 'power' | 'defense' | 'manaCost' | 'rarity';
export type SortDirection = 'asc' | 'desc';

// Estado de la gestión de cartas
interface CardState {
    // Estado
    cards: CardItem[];
    favoriteCardIds: string[];
    recentlyViewedIds: string[];
    selectedCardId: string | null;
    isLoading: boolean;
    error: string | null;

    // Filtros
    filters: CardSearchFilters;

    // Ordenamiento
    sortOption: SortOption;
    sortDirection: SortDirection;

    // Paginación
    page: number;
    pageSize: number;

    // Acciones - Cartas
    setCards: (cards: CardItem[]) => void;
    addCard: (card: CardItem) => void;
    removeCard: (cardId: string) => void;
    clearCards: () => void;
    selectCard: (cardId: string | null) => void;

    // Acciones - Favoritos
    addToFavorites: (cardId: string) => void;
    removeFromFavorites: (cardId: string) => void;
    toggleFavorite: (cardId: string) => void;
    clearFavorites: () => void;

    // Acciones - Recientes
    addToRecentlyViewed: (cardId: string) => void;
    clearRecentlyViewed: () => void;

    // Acciones - Filtros
    setFilters: (filters: Partial<CardSearchFilters>) => void;
    resetFilters: () => void;

    // Acciones - Ordenamiento
    setSortOption: (option: SortOption) => void;
    setSortDirection: (direction: SortDirection) => void;
    toggleSortDirection: () => void;

    // Acciones - Paginación
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    nextPage: () => void;
    prevPage: () => void;

    // Acciones - Estado
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

// Valores iniciales para filtros
const initialFilters: CardSearchFilters = {
    name: '',
    types: [],
    rarities: [],
    elements: [],
    sets: []
};

// Crear el store base
const useCardStoreBase = create<CardState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            cards: [],
            favoriteCardIds: [],
            recentlyViewedIds: [],
            selectedCardId: null,
            isLoading: false,
            error: null,

            // Filtros iniciales
            filters: initialFilters,

            // Ordenamiento inicial
            sortOption: 'name',
            sortDirection: 'asc',

            // Paginación inicial
            page: 1,
            pageSize: 20,

            // Acciones - Cartas
            setCards: (cards) => set({ cards }),

            addCard: (card) => set(
                produce((state: CardState) => {
                    if (!state.cards.some(c => c.id === card.id)) {
                        state.cards.push(card);
                    }
                })
            ),

            removeCard: (cardId) => set(
                produce((state: CardState) => {
                    state.cards = state.cards.filter(card => card.id !== cardId);

                    // Si la carta eliminada era la seleccionada, limpiar la selección
                    if (state.selectedCardId === cardId) {
                        state.selectedCardId = null;
                    }

                    // También eliminar de favoritos y vistos recientemente
                    state.favoriteCardIds = state.favoriteCardIds.filter(id => id !== cardId);
                    state.recentlyViewedIds = state.recentlyViewedIds.filter(id => id !== cardId);
                })
            ),

            clearCards: () => set({ cards: [] }),

            selectCard: (cardId) => set(
                produce((state: CardState) => {
                    state.selectedCardId = cardId;

                    // Si hay un cardId válido, agregarlo a recientes
                    if (cardId) {
                        // Remover la carta si ya existe en la lista
                        const filteredRecents = state.recentlyViewedIds.filter(id => id !== cardId);
                        // Añadir al principio de la lista
                        state.recentlyViewedIds = [cardId, ...filteredRecents].slice(0, 10);
                    }
                })
            ),

            // Acciones - Favoritos
            addToFavorites: (cardId) => set(
                produce((state: CardState) => {
                    if (!state.favoriteCardIds.includes(cardId)) {
                        state.favoriteCardIds.push(cardId);
                        toast.success('Carta añadida a favoritos');
                    }
                })
            ),

            removeFromFavorites: (cardId) => set(
                produce((state: CardState) => {
                    state.favoriteCardIds = state.favoriteCardIds.filter(id => id !== cardId);
                    toast.info('Carta eliminada de favoritos');
                })
            ),

            toggleFavorite: (cardId) => {
                const { favoriteCardIds } = get();
                const isFavorite = favoriteCardIds.includes(cardId);

                if (isFavorite) {
                    get().removeFromFavorites(cardId);
                } else {
                    get().addToFavorites(cardId);
                }
            },

            clearFavorites: () => set({ favoriteCardIds: [] }),

            // Acciones - Recientes
            addToRecentlyViewed: (cardId) => set(
                produce((state: CardState) => {
                    // Remover la carta si ya existe en la lista
                    const filteredRecents = state.recentlyViewedIds.filter(id => id !== cardId);
                    // Añadir al principio de la lista y mantener solo los 10 más recientes
                    state.recentlyViewedIds = [cardId, ...filteredRecents].slice(0, 10);
                })
            ),

            clearRecentlyViewed: () => set({ recentlyViewedIds: [] }),

            // Acciones - Filtros
            setFilters: (filters) => set(
                produce((state: CardState) => {
                    state.filters = { ...state.filters, ...filters };
                    // Resetear a la primera página cuando cambian los filtros
                    state.page = 1;
                })
            ),

            resetFilters: () => set(
                produce((state: CardState) => {
                    state.filters = initialFilters;
                    state.page = 1;
                })
            ),

            // Acciones - Ordenamiento
            setSortOption: (option) => set({ sortOption: option }),

            setSortDirection: (direction) => set({ sortDirection: direction }),

            toggleSortDirection: () => set(
                produce((state: CardState) => {
                    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                })
            ),

            // Acciones - Paginación
            setPage: (page) => set({ page }),

            setPageSize: (pageSize) => set(
                produce((state: CardState) => {
                    state.pageSize = pageSize;
                    // Reajustar la página actual si excede el total
                    const totalPages = Math.ceil(state.cards.length / pageSize);
                    if (state.page > totalPages) {
                        state.page = Math.max(1, totalPages);
                    }
                })
            ),

            nextPage: () => set(
                produce((state: CardState) => {
                    const totalPages = Math.ceil(state.cards.length / state.pageSize);
                    if (state.page < totalPages) {
                        state.page += 1;
                    }
                })
            ),

            prevPage: () => set(
                produce((state: CardState) => {
                    if (state.page > 1) {
                        state.page -= 1;
                    }
                })
            ),

            // Acciones - Estado
            setLoading: (loading) => set({ isLoading: loading }),

            setError: (error) => set({ error })
        }),
        {
            name: 'kodem-card-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                favoriteCardIds: state.favoriteCardIds,
                recentlyViewedIds: state.recentlyViewedIds,
                filters: state.filters,
                sortOption: state.sortOption,
                sortDirection: state.sortDirection,
                pageSize: state.pageSize
            })
        }
    )
);

// Exportar el store con selectores memoizados
export const useCardStore = useCardStoreBase;

// Selectores derivados
export const useCardSelectors = {
    // Seleccionar cartas filtradas, ordenadas y paginadas
    getFilteredCards: (state: CardState) => {
        // Filtrar cartas
        let filtered = state.cards;
        const filters = state.filters;

        if (filters.name) {
            filtered = filtered.filter(card =>
                card.name.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        if (filters.types.length > 0) {
            filtered = filtered.filter(card =>
                filters.types.includes(card.cardType || '')
            );
        }

        if (filters.rarities.length > 0) {
            filtered = filtered.filter(card =>
                filters.rarities.includes(card.rarity || '')
            );
        }

        if (filters.elements.length > 0) {
            filtered = filtered.filter(card =>
                filters.elements.includes(card.element || '')
            );
        }

        if (filters.sets.length > 0) {
            filtered = filtered.filter(card =>
                typeof card.set === 'string' && filters.sets.includes(card.set)
            );
        }

        // Filtrar por rangos numéricos si están definidos
        if (filters.minPower !== undefined) {
            filtered = filtered.filter(card =>
                (card.power || 0) >= (filters.minPower || 0)
            );
        }

        if (filters.maxPower !== undefined) {
            filtered = filtered.filter(card =>
                (card.power || 0) <= (filters.maxPower || 0)
            );
        }

        if (filters.minDefense !== undefined) {
            filtered = filtered.filter(card =>
                (card.defense || 0) >= (filters.minDefense || 0)
            );
        }

        if (filters.maxDefense !== undefined) {
            filtered = filtered.filter(card =>
                (card.defense || 0) <= (filters.maxDefense || 0)
            );
        }

        if (filters.minManaCost !== undefined) {
            filtered = filtered.filter(card =>
                (card.manaCost || 0) >= (filters.minManaCost || 0)
            );
        }

        if (filters.maxManaCost !== undefined) {
            filtered = filtered.filter(card =>
                (card.manaCost || 0) <= (filters.maxManaCost || 0)
            );
        }

        // Ordenar cartas
        const { sortOption, sortDirection } = state;

        filtered = [...filtered].sort((a, b) => {
            const aValue = a[sortOption] || 0;
            const bValue = b[sortOption] || 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortDirection === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });

        return filtered;
    },

    // Obtener cartas paginadas
    getPaginatedCards: (state: CardState) => {
        const filteredCards = useCardSelectors.getFilteredCards(state);
        const { page, pageSize } = state;

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return filteredCards.slice(startIndex, endIndex);
    },

    // Obtener cartas favoritas
    getFavoriteCards: (state: CardState) => {
        return state.cards.filter(card =>
            state.favoriteCardIds.includes(card.id)
        );
    },

    // Obtener cartas vistas recientemente
    getRecentlyViewedCards: (state: CardState) => {
        // Ordenar por el orden de visualización (mantener el orden de recentlyViewedIds)
        return state.recentlyViewedIds
            .map(id => state.cards.find(card => card.id === id))
            .filter(card => card !== undefined) as CardItem[];
    },

    // Obtener carta seleccionada
    getSelectedCard: (state: CardState) => {
        return state.selectedCardId
            ? state.cards.find(card => card.id === state.selectedCardId)
            : null;
    },

    // Obtener el número total de páginas
    getTotalPages: (state: CardState) => {
        const filteredCards = useCardSelectors.getFilteredCards(state);
        return Math.ceil(filteredCards.length / state.pageSize);
    },

    // Comprobar si una carta es favorita
    isFavorite: (state: CardState, cardId: string | number) => {
        return (state.favoriteCardIds as string[]).includes(String(cardId));
    }
};

// Reemplazar el valor de retorno de tipo 'any' en la función filterCardsByText
export const filterCardsByText = (cards: CardDetails[], searchValue: string): CardDetails[] => {
    if (!searchValue.trim()) return cards;
    const normalizedSearch = searchValue.toLowerCase();
    
    return cards.filter(card => {
        const cardName = card.name.toLowerCase();
        return cardName.includes(normalizedSearch);
    });
}; 