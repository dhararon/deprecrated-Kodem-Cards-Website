import React, { useState, useEffect } from 'react';
import { deleteCard, queryCards } from '@/lib/firebase/services/cardService';
import { toast } from 'sonner';
import { CardType, CardEnergy, CardRarity, CardSet, Card } from '@/types/card';
import { CardsTemplate } from '@/components/templates/CardsTemplate';

/**
 * Página de administración para cartas
 */
export const CardsManager = () => {
    // Estados para las cartas y filtros
    const [cards, setCards] = useState<Card[]>([]);
    const [filteredCards, setFilteredCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para el componente
    const [showCardModal, setShowCardModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Estados para los filtros
    const [typeFilter, setTypeFilter] = useState<CardType | "all_types">("all_types");
    const [energyFilter, setEnergyFilter] = useState<CardEnergy | 'all_energies'>('all_energies');
    const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all_rarities'>('all_rarities');
    const [artistFilter, setArtistFilter] = useState<string>('all_artists');
    const [setFilter, setSetFilter] = useState<CardSet | 'all_sets'>('all_sets');
    const [standardLegalFilter, setStandardLegalFilter] = useState<boolean>(false);

    // Hook para cargar datos basado en filtros y búsqueda (debounced)
    useEffect(() => {
        const loadFilteredData = async () => {
            setLoading(true);
            console.log('[CardsManager] Iniciando carga con filtros:', {
                searchTerm: searchTerm,
                type: typeFilter,
                energy: energyFilter,
                rarity: rarityFilter,
                set: setFilter,
                artist: artistFilter,
                standardLegal: standardLegalFilter
            }); // Log: Filtros antes de llamar al servicio
            try {
                // Usar queryCards en lugar de getAllCards para tener búsqueda más eficiente
                const allCardsData = await queryCards({
                    searchTerm: searchTerm,
                    type: typeFilter,
                    energy: energyFilter,
                    rarity: rarityFilter,
                    set: setFilter,
                    artist: artistFilter,
                    standardLegal: standardLegalFilter
                });

                console.log('[CardsManager] Datos recibidos del servicio (queryCards):', allCardsData); // Log: Datos crudos del servicio

                // Los filtros ya son aplicados por queryCards, pero aplicamos el filtro por fullId aquí si hay un término de búsqueda
                let filteredData = allCardsData;
                
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    // Aplicar filtro adicional para fullId, ya que queryCards podría no incluirlo
                    filteredData = filteredData.filter(card => 
                        (card.fullId && card.fullId.toLowerCase().includes(searchLower)) ||
                        card.name.toLowerCase().includes(searchLower)
                    );
                }

                const processedCards = filteredData.map(card => ({
                    ...card,
                    id: card.id
                } as Card));

                console.log('[CardsManager] Datos procesados para el estado:', processedCards); // Log: Datos mapeados

                setCards(allCardsData);
                setFilteredCards(processedCards);

            } catch (error) {
                console.error('[CardsManager] Error al cargar datos filtrados:', error);
                setCards([]);
                setFilteredCards([]);
            } finally {
                setLoading(false);
            }
        };
        loadFilteredData();
    }, [
        searchTerm,
        typeFilter,
        energyFilter,
        rarityFilter,
        setFilter,
        artistFilter,
        standardLegalFilter
    ]);

    // Obtener valores únicos para filtros
    const uniqueArtists = Array.from(new Set(cards.flatMap(card => card.artist || []).filter(Boolean)));
    
    // Verificar si hay filtros activos
    const hasActiveFilters = typeFilter !== "all_types" ||
        energyFilter !== "all_energies" ||
        rarityFilter !== "all_rarities" ||
        artistFilter !== "all_artists" ||
        setFilter !== "all_sets" ||
        standardLegalFilter;

    // Limpiar todos los filtros
    const clearFilters = () => {
        setTypeFilter("all_types");
        setEnergyFilter("all_energies");
        setRarityFilter("all_rarities");
        setArtistFilter("all_artists");
        setSetFilter("all_sets");
        setStandardLegalFilter(false);
        setSearchTerm('');
    };

    // Manejar el cambio en el campo de búsqueda
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Función para crear nueva tarjeta
    const handleNewCard = () => {
        // Limpiar completamente el estado de la carta actual
        setCurrentCard(null);
        setEditMode(false);
        setShowCardModal(true);
    };

    // Función para editar tarjeta
    const handleEditCard = (card: Card) => {
        setCurrentCard(card);
        setEditMode(true);
        setShowCardModal(true);
    };

    // Función para mostrar confirmación de eliminar
    const handleDeletePrompt = (card: Card) => {
        setCurrentCard(card);
        setShowDeleteModal(true);
    };

    // Función para eliminar tarjeta
    const handleDeleteCard = async () => {
        if (!currentCard) return;
        setIsDeleting(true);
        try {
            await deleteCard(currentCard.id);
            toast.success(`Tarjeta "${currentCard.name}" eliminada.`);
            // Actualizar la lista
            setCards(prevCards => prevCards.filter(card => card.id !== currentCard.id));
            setFilteredCards(prevCards => prevCards.filter(card => card.id !== currentCard.id));
        } catch (error) {
            console.error('[CardsManager] Error al eliminar tarjeta:', error);
            toast.error('Error al eliminar la tarjeta.');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setCurrentCard(null);
        }
    };

    // Función para cancelar eliminación
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setCurrentCard(null);
    };

    // Función que se ejecuta cuando se guarda la tarjeta
    const handleCardSaved = (savedCard: Card) => {
        // Actualizar la lista de tarjetas con la nueva o actualizada
        setCards(prevCards => {
            const existingCardIndex = prevCards.findIndex(c => c.id === savedCard.id);
            if (existingCardIndex >= 0) {
                // Actualizar tarjeta existente
                const updatedCards = [...prevCards];
                updatedCards[existingCardIndex] = savedCard;
                return updatedCards;
            } else {
                // Agregar nueva tarjeta
                return [...prevCards, savedCard];
            }
        });

        // Recargar los datos filtrados para asegurarse de que todo esté actualizado
        // Esta es una forma más directa de asegurar que los datos se actualicen correctamente
        // en lugar de intentar manipular manualmente el estado filteredCards
        const loadFilteredData = async () => {
            try {
                // Usar queryCards para obtener datos actualizados
                const allCardsData = await queryCards({
                    searchTerm: searchTerm,
                    type: typeFilter,
                    energy: energyFilter,
                    rarity: rarityFilter,
                    set: setFilter,
                    artist: artistFilter,
                    standardLegal: standardLegalFilter
                });

                // Procesar y aplicar filtros adicionales si es necesario
                let filteredData = allCardsData;
                
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    filteredData = filteredData.filter(card => 
                        (card.fullId && card.fullId.toLowerCase().includes(searchLower)) ||
                        card.name.toLowerCase().includes(searchLower)
                    );
                }

                const processedCards = filteredData.map(card => ({
                    ...card,
                    id: card.id
                } as Card));

                // Actualizar el estado
                setFilteredCards(processedCards);
            } catch (error) {
                console.error('[CardsManager] Error al recargar datos después de guardar:', error);
            }
        };

        // Llamar a la función para recargar los datos
        loadFilteredData();

        // Cerrar el modal después de guardar exitosamente
        setShowCardModal(false);

        // Reiniciar el estado de la carta actual después de guardar
        setCurrentCard(null);

        // Mostrar notificación
        toast.success(`Tarjeta "${savedCard.name}" guardada exitosamente`);
    };

    // Control del modal de cartas
    const handleCardModalChange = (open: boolean) => {
        setShowCardModal(open);

        // Si se está cerrando el modal, reiniciar el estado
        if (!open) {
            setCurrentCard(null);
            setEditMode(false);
        }
    };

    // Manejar cambios en los filtros
    const handleTypeFilterChange = (value: string) => {
        setTypeFilter(value as CardType | "all_types");
    };

    const handleEnergyFilterChange = (value: string) => {
        setEnergyFilter(value as CardEnergy | 'all_energies');
    };

    const handleRarityFilterChange = (value: string) => {
        setRarityFilter(value as CardRarity | 'all_rarities');
    };

    const handleArtistFilterChange = (value: string) => {
        setArtistFilter(value);
    };

    const handleSetFilterChange = (value: string) => {
        setSetFilter(value as CardSet | 'all_sets');
    };

    const handleStandardLegalFilterChange = (value: boolean) => {
        setStandardLegalFilter(value);
    };

    // Ordenar las cartas filtradas por el campo 'cardNumber' (numérico ascendente)
    const sortedFilteredCards = [...filteredCards].sort((a, b) => {
        const numA = typeof a.cardNumber === 'number' ? a.cardNumber : parseInt(a.cardNumber, 10);
        const numB = typeof b.cardNumber === 'number' ? b.cardNumber : parseInt(b.cardNumber, 10);
        // Si alguno no tiene número, lo manda al final
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
            <CardsTemplate
                cards={sortedFilteredCards as any[]}
                isLoading={loading}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onNewCard={handleNewCard}
                onEditCard={handleEditCard as any}
                onDeletePrompt={handleDeletePrompt as any}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                typeFilter={typeFilter as CardType | "all_types"}
                onTypeFilterChange={handleTypeFilterChange}
                energyFilter={energyFilter}
                onEnergyFilterChange={handleEnergyFilterChange}
                rarityFilter={rarityFilter}
                onRarityFilterChange={handleRarityFilterChange}
                artistFilter={artistFilter}
                onArtistFilterChange={handleArtistFilterChange}
                setFilter={setFilter}
                onSetFilterChange={handleSetFilterChange}
                standardLegalFilter={standardLegalFilter}
                onStandardLegalFilterChange={handleStandardLegalFilterChange}
                uniqueArtists={uniqueArtists}
                currentCard={currentCard as any}
                editMode={editMode}
                showCardModal={showCardModal}
                onCardModalChange={handleCardModalChange}
                onCardSaved={handleCardSaved as any}
                showDeleteModal={showDeleteModal}
                isDeleting={isDeleting}
                onDeleteCard={handleDeleteCard}
                onCancelDelete={handleCancelDelete}
            />
        </div>
    );
};

// Agregar exportación por defecto para lazy loading
export default CardsManager; 