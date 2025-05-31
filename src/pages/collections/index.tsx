import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import CollectionSetTabs from '@/components/organisms/CollectionSetTabs';
import { CollectionFilters } from '@/components/organisms/CollectionFilters';
import { useCollection } from '@/hooks/useCollection';
import { useCollectionFilters } from '@/hooks/useCollectionFilters';
import { CardSet } from '@/types/card';
import { CardWithQuantity } from '@/types/collection';

/**
 * Collection - Página principal de la colección de cartas del usuario
 * @returns Componente React de la página de colección
 */
export default function Collection() {
    const { user } = useAuth();
    const {
        loading,
        userCollection,
        refreshCollection,
        updateCardQuantity
    } = useCollection();

    const [activeSet, setActiveSet] = React.useState<string | null>(null);
    const [updating, setUpdating] = React.useState<string | null>(null);
    const [isFiltersExpanded, setIsFiltersExpanded] = React.useState<boolean>(false);

    // Cuando la colección cambie, establecer el set "todos_los_sets" como activo
    React.useEffect(() => {
        if (userCollection && !activeSet) {
            // Usar el set especial "todos_los_sets" por defecto
            setActiveSet("todos_los_sets");
        }
    }, [userCollection, activeSet]);

    // Agregar depuración para ver qué cartas están disponibles en la colección
    React.useEffect(() => {
        if (userCollection) {
            console.log("Colección cargada:", userCollection);

            // Depurar las cartas por set
            Object.entries(userCollection.cardsBySet).forEach(([setName, cards]) => {
                console.log(`Set ${setName}: ${cards.length} cartas`);
                if (cards.length > 0) {
                    console.log(`  Ejemplo carta:`, {
                        name: cards[0].mainCard.name,
                        set: cards[0].mainCard.cardSet,
                        id: cards[0].mainCard.id
                    });
                }
            });
        }
    }, [userCollection]);

    const {
        filters,
        updateFilters,
        clearFilters,
        hasActiveFilters,
        applyFilters,
        groupCardsByRarity
    } = useCollectionFilters();

    // Manejar actualización de cantidad
    const handleQuantityUpdate = async (cardId: string, quantity: number) => {
        if (!user?.id) return;

        setUpdating(cardId);
        try {
            // Usar la función de actualización del contexto
            await updateCardQuantity(cardId, quantity);
            console.log(`Carta ${cardId} actualizada: cantidad = ${quantity}`);
        } catch (error) {
            console.error("Error al actualizar la cantidad de la carta:", error);
            // Recargar la colección para volver al estado anterior
            await refreshCollection();
        } finally {
            setUpdating(null);
        }
    };

    // Interfaz para manejar los datos procesados de la colección
    interface ProcessedSetData {
        cards: CardWithQuantity[]; // Tipo más específico
        cardsByRarity: Record<string, CardWithQuantity[]>;
        collectedCount: number;
        totalCount: number;
    }

    // Procesar la colección para mostrarla para todos los sets
    const processedCollection = useMemo(() => {
        if (!userCollection) {
            console.log("Sin colección, no se puede procesar");
            return {};
        }

        console.log("Procesando colección para mostrar...");

        // Crear un objeto con todos los sets disponibles
        const result: Record<string, ProcessedSetData> = {};

        // Procesar cada set individualmente
        Object.values(CardSet).forEach(setName => {
            // Obtener las cartas que pertenecen específicamente a este set
            const setCards = userCollection.cardsBySet[setName] || [];

            console.log(`Set ${setName}: Procesando ${setCards.length} cartas`);

            // Aplicar filtros a las cartas del set
            const filteredCards = applyFilters(setCards);

            console.log(`Set ${setName}: Después de filtros: ${filteredCards.length} cartas`);

            // Contar cartas coleccionadas
            const collectedCount = filteredCards.filter(card => card.mainCard.inCollection).length;

            // Agrupar por rareza para el componente CollectionGrid
            const cardsByRarity = groupCardsByRarity(filteredCards);

            // Guardar los datos procesados de este set
            result[setName] = {
                cards: filteredCards,
                cardsByRarity,
                collectedCount: collectedCount,
                totalCount: filteredCards.length
            };

            console.log(`Set ${setName}: Datos procesados`, {
                cartas: filteredCards.length,
                coleccionadas: result[setName].collectedCount,
                total: result[setName].totalCount
            });
        });

        return result;
    }, [userCollection, applyFilters, groupCardsByRarity]);

    // Obtener los sets que tienen al menos una carta (solo para información)
    const availableSets = useMemo(() => {
        if (!userCollection) return [];

        // Obtener los sets que tienen al menos una carta
        const setsWithCards = Object.keys(userCollection.cardsBySet).filter(
            setName => userCollection.cardsBySet[setName] && userCollection.cardsBySet[setName].length > 0
        );

        return setsWithCards;
    }, [userCollection]);

    // Si no hay usuario autenticado, mostrar mensaje
    if (!user) {
        return (
            <EmptyState
                title="Acceso no autorizado"
                description="Debes iniciar sesión para ver tu colección"
                icon="lock"
            />
        );
    }

    // Si está cargando, mostrar spinner
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    console.log("Renderizando página de colección", {
        activeSet,
        setsProcesados: processedCollection ? Object.keys(processedCollection).length : 0
    });

    return (
        <div className="px-3 py-4 sm:container sm:px-4 sm:py-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-6">Mi Colección</h1>

            {/* Contenedor principal con gaps optimizados para móvil */}
            <div className="flex flex-col space-y-3 sm:space-y-4 flex-1">
                {/* Filtros: colapsables en móvil, siempre visibles en desktop */}
                <div className="rounded-lg overflow-hidden border shadow-sm">
                    {/* Encabezado de filtros: botón colapsable solo en móvil, título fijo en desktop */}
                    <div className="w-full flex items-center justify-between p-3 bg-card text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                            </svg>
                            Filtros {hasActiveFilters && "(Activos)"}
                        </span>
                        {/* Botón de colapso solo visible en móvil */}
                        <button 
                            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                            className="sm:hidden flex items-center"
                            aria-label={isFiltersExpanded ? "Contraer filtros" : "Expandir filtros"}
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className={`transition-transform ${isFiltersExpanded ? "rotate-180" : ""}`}
                            >
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                    </div>
                    
                    {/* Panel de filtros: colapsable en móvil, siempre visible en desktop */}
                    <div className={`overflow-hidden transition-all sm:max-h-screen ${isFiltersExpanded ? "max-h-screen" : "max-h-0"}`}>
                        <CollectionFilters
                            filters={filters}
                            onFiltersChange={updateFilters}
                            onClearFilters={clearFilters}
                        />
                    </div>
                </div>

                {/* Pestañas de sets */}
                {activeSet && (
                    <CollectionSetTabs
                        sets={availableSets}
                        activeSet={activeSet}
                        setActiveSet={setActiveSet}
                        collectionBySet={processedCollection}
                        onUpdateQuantity={handleQuantityUpdate}
                        updatingCardId={updating}
                    />
                )}
            </div>
        </div>
    );
} 