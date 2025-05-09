import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Card, CardContent } from '@/components/atoms/Card';
import { CardImage } from '@/components/molecules/CardImage';
import { SearchBar, SearchFilter } from '@/components/molecules/SearchBar';
import { ModalDialog } from '@/components/molecules/ModalDialog';
import {
    Loader2, X, ChevronDown, ChevronUp,
    Trash2, PlusIcon, CheckIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllCards } from '@/lib/firebase/services/cardService';
import { cn } from '@/lib/utils';

// Interfaz para la carta de Firebase
export interface FirebaseCardType {
    id: string;
    name: string;
    imageUrl?: string;
    type?: string;
    cardType?: string;
    rarity?: string;
    setId?: string;
    set?: string;
    energy?: string;
    energyType?: string;
    description?: string;
    [key: string]: unknown;
}

interface CardSearchProps {
    onSelectCard: (card: FirebaseCardType) => void;
    onRemoveCard?: (cardId: string) => void;
    onClearAll?: () => void;
    currentDeck?: FirebaseCardType[];
    cardLimits?: Record<string, number>;
    maxDeckSize?: number;
    className?: string;
}

/**
 * CardSearch - Componente de búsqueda de cartas con filtrado, selección y visualización
 */
export function CardSearch({
    onSelectCard,
    onRemoveCard,
    onClearAll,
    currentDeck = [],
    cardLimits = {
        "protector": 2,
        "adendei": 3,
        "rava": 3,
        "bio": 3,
        "ixim": 3,
        "rot": 3,
        "default": 4 // Límite predeterminado para otros tipos
    },
    maxDeckSize = 34,
    className
}: CardSearchProps) {
    // Estados para la búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<FirebaseCardType[]>([]);
    const [isSelectedCardsOpen, setIsSelectedCardsOpen] = useState(false);

    // Estado para el modal de imagen
    const [selectedImageCard, setSelectedImageCard] = useState<FirebaseCardType | null>(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);

    // Filtros activos
    const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [allCards, setAllCards] = useState<FirebaseCardType[]>([]);
    const cardsPerPage = 6;

    useEffect(() => {
        // Cargar colecciones al montar el componente
        const loadCollections = async () => {
            try {
                // Si necesitamos cargar colecciones en el futuro, podemos hacerlo aquí.
                // Por ahora, esta función está vacía.
            } catch (error) {
                console.error("Error al cargar colecciones:", error);
            }
        };

        loadCollections();
        loadInitialCards();
    }, []);

    // Función para actualizar los resultados paginados envuelta en useCallback
    const updatePaginatedResults = useCallback(() => {
        const startIndex = (currentPage - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const paginatedCards = allCards.slice(startIndex, endIndex);

        setSearchResults(paginatedCards);
        setTotalPages(Math.ceil(allCards.length / cardsPerPage));
    }, [allCards, currentPage, cardsPerPage]);
    
    // Actualizar los resultados paginados cuando cambian las cartas o la página
    useEffect(() => {
        updatePaginatedResults();
    }, [updatePaginatedResults]);

    // Cargar cartas iniciales
    const loadInitialCards = async () => {
        try {
            setIsLoading(true);
            // Obtener cartas desde Firestore
            const results = await getAllCards();
            // Asegurar la compatibilidad de tipos
            setAllCards(results as unknown as FirebaseCardType[]);
        } catch (error) {
            console.error("Error al cargar cartas iniciales:", error);
            toast.error("Error al cargar las cartas");
            setAllCards([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Realizar búsqueda
    const performSearch = async () => {
        try {
            setIsLoading(true);
            setCurrentPage(1); // Reiniciar a la primera página

            // Extraer valores de filtros
            const filterValues = {
                name: searchTerm,
                types: activeFilters.filter(f => f.label === "Tipo").map(f => f.value),
                sets: activeFilters.filter(f => f.label === "Set").map(f => f.value),
                energies: activeFilters.filter(f => f.label === "Energía").map(f => f.value),
            };

            // Consultar a Firestore
            let results: FirebaseCardType[] = [];
            if (Object.values(filterValues).every(v => Array.isArray(v) ? v.length === 0 : !v)) {
                // Si no hay filtros, cargar todas las cartas
                results = await getAllCards() as unknown as FirebaseCardType[];
            } else {
                // Si hay filtros, aplicarlos
                results = await getAllCards() as unknown as FirebaseCardType[];

                // Filtrado en el cliente
                if (filterValues.name) {
                    results = results.filter(card =>
                        card.name.toLowerCase().includes(filterValues.name.toLowerCase())
                    );
                }
                if (filterValues.types.length > 0) {
                    results = results.filter(card =>
                        filterValues.types.includes(card.type || '')
                    );
                }
                if (filterValues.energies.length > 0) {
                    results = results.filter(card =>
                        filterValues.energies.includes(card.energy || '')
                    );
                }
                if (filterValues.sets.length > 0) {
                    results = results.filter(card =>
                        filterValues.sets.includes((card.setName as string) || '')
                    );
                }
            }

            setAllCards(results);
        } catch (error) {
            console.error("Error en la búsqueda:", error);
            toast.error("Error al realizar la búsqueda");
            setAllCards([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Manejar cambio en los filtros
    const handleFilterChange = (filters: SearchFilter[]) => {
        setActiveFilters(filters);
    };

    // Verificar si una carta ya está en el mazo
    const isCardInDeck = (cardId: string): boolean => {
        return currentDeck.some(card => card.id === cardId);
    };

    // Verificar si se ha alcanzado el límite para un tipo de carta
    const hasReachedTypeLimit = (card: FirebaseCardType): boolean => {
        if (currentDeck.length >= maxDeckSize) {
            return true;
        }

        // Obtener el límite para este tipo de carta
        const typeKey = (card.cardType || 'default').toLowerCase();
        const limit = cardLimits[typeKey] || cardLimits.default;

        // Contar cuántas cartas de este tipo ya están en el mazo
        const typeCount = currentDeck.filter(c =>
            c.name === card.name
        ).length;

        return typeCount >= limit;
    };

    // Hacer clic en la imagen para mostrar el modal
    const handleImageClick = (card: FirebaseCardType) => {
        setSelectedImageCard(card);
        setImageModalOpen(true);
    };

    // Renderizar contador de cartas
    const renderCardCounter = () => {
        return (
            <div className="flex items-center">
                <span className="text-sm font-medium">
                    {currentDeck.length} cartas seleccionadas
                </span>
            </div>
        );
    };

    // Navegar a la página anterior
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Navegar a la página siguiente
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Obtener color hexadecimal para el tipo de carta
    const getElementColorHex = (type: string): string => {
        if (!type) return '#94a3b8'; // Gris por defecto

        const typeLower = type.toLowerCase();
        switch (typeLower) {
            case 'agua':
            case 'water':
            case 'b':
                return '#3b82f6'; // Azul
            case 'fuego':
            case 'fire':
            case 'r':
                return '#ef4444'; // Rojo
            case 'tierra':
            case 'earth':
            case 'g':
                return '#84cc16'; // Verde
            case 'aire':
            case 'wind':
            case 'air':
            case 'w':
                return '#f97316'; // Naranja
            case 'luz':
            case 'light':
            case 'white':
                return '#facc15'; // Amarillo
            case 'oscuridad':
            case 'darkness':
            case 'dark':
            case 'black':
                return '#6b21a8'; // Púrpura
            default:
                return '#94a3b8'; // Gris por defecto
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Barra de búsqueda y filtros */}
            <SearchBar
                onSearch={(text) => {
                    setSearchTerm(text);
                    performSearch();
                }}
                onFilterChange={handleFilterChange}
                placeholder="Buscar cartas por nombre..."
                initialFilters={activeFilters}
                showFilterButton={true}
            />

            {/* Contador de cartas y botón de cartas seleccionadas */}
            <div className="flex justify-between items-center">
                {renderCardCounter()}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectedCardsOpen(!isSelectedCardsOpen)}
                    className="flex items-center gap-1"
                >
                    <span>Cartas seleccionadas</span>
                    {isSelectedCardsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {/* Panel de cartas seleccionadas */}
            {isSelectedCardsOpen && (
                <Card className="p-4">
                    <CardContent className="p-0">
                        {currentDeck.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No hay cartas seleccionadas
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium">Cartas en el mazo</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClearAll}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Limpiar todo
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {currentDeck.map((card) => (
                                        <div
                                            key={card.id}
                                            className="flex items-center p-2 rounded-md border group hover:bg-gray-50"
                                        >
                                            <div className="w-10 h-10 mr-2 overflow-hidden rounded-md flex-shrink-0">
                                                <CardImage
                                                    imageUrl={card.imageUrl}
                                                    cardName={card.name}
                                                    element={card.energy}
                                                    aspectRatio="square"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-xs font-medium truncate">{card.name}</p>
                                            </div>
                                            {onRemoveCard && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => onRemoveCard(card.id)}
                                                    title="Eliminar carta"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Resultados de búsqueda */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="ml-3 text-gray-600">Buscando cartas...</span>
                </div>
            ) : searchResults.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-gray-600 text-center">
                    <p>No se encontraron cartas que coincidan con tu búsqueda</p>
                    <p className="text-sm mt-2">Intenta con otros términos o filtros</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-100 p-2 rounded mb-4">
                        <h3 className="font-bold">Datos de DEBUG:</h3>
                        <p>Total de resultados: {allCards.length}</p>
                        <p>Cartas en el mazo: {currentDeck.length}</p>
                        <p>Página actual: {currentPage} de {totalPages}</p>
                        <p>Cartas por página: {cardsPerPage}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {searchResults.map((card) => {
                            const isSelected = isCardInDeck(card.id);
                            const reachedLimit = hasReachedTypeLimit(card);

                            return (
                                <div key={card.id} className={cn(
                                    "relative group border border-gray-200 rounded-md p-2",
                                    isSelected ? "opacity-60" : ""
                                )}>
                                    <div className="text-xs mb-2 bg-gray-100 p-1 rounded">
                                        <p><strong>ID:</strong> {card.id}</p>
                                        <p><strong>Nombre:</strong> {card.name}</p>
                                        <p><strong>URL Imagen:</strong> {card.imageUrl || 'No tiene'}</p>
                                    </div>

                                    {/* Solo mostrar la imagen de la carta */}
                                    <CardImage
                                        imageUrl={card.imageUrl}
                                        cardName={card.name}
                                        element={card.energy}
                                        className="w-full rounded-md"
                                        onClick={() => handleImageClick(card)}
                                    />

                                    {/* Overlay para cartas seleccionadas */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                                            <Badge variant="secondary" className="bg-white">
                                                <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                                                En Mazo
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Botón circular para agregar la carta (solo mostrar si no está seleccionada) */}
                                    {!isSelected && (
                                        <Button
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                onSelectCard(card);
                                            }}
                                            disabled={reachedLimit}
                                            size="icon"
                                            variant="default"
                                            className="absolute bottom-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Controles de paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className="flex items-center"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                            </Button>

                            <span className="text-sm">
                                Página {currentPage} de {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className="flex items-center"
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal para ver la imagen de la carta */}
            <ModalDialog
                isOpen={imageModalOpen}
                onOpenChange={setImageModalOpen}
                title={selectedImageCard?.name || "Detalle de la carta"}
                description={selectedImageCard?.setName ? `${selectedImageCard.setName}` : undefined}
            >
                {selectedImageCard && (
                    <div className="flex flex-col items-center space-y-4">
                        <CardImage
                            imageUrl={selectedImageCard.imageUrl}
                            cardName={selectedImageCard.name}
                            element={selectedImageCard.energy || selectedImageCard.type}
                            className="w-full max-h-96"
                        />
                        <div className="w-full">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedImageCard.cardType && (
                                    <Badge
                                        style={{ backgroundColor: getElementColorHex(selectedImageCard.energy || selectedImageCard.type || "") }}
                                        className="text-white"
                                    >
                                        {selectedImageCard.cardType}
                                    </Badge>
                                )}
                            </div>
                            {selectedImageCard.description && (
                                <p className="text-sm text-gray-600 mt-2">{selectedImageCard.description}</p>
                            )}
                        </div>

                        <div className="flex justify-end w-full">
                            {isCardInDeck(selectedImageCard.id) ? (
                                <Button
                                    variant="outline"
                                    onClick={() => onRemoveCard && onRemoveCard(selectedImageCard.id)}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Eliminar del mazo
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        onSelectCard(selectedImageCard);
                                        setImageModalOpen(false);
                                    }}
                                    disabled={hasReachedTypeLimit(selectedImageCard)}
                                >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Añadir al mazo
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </ModalDialog>
        </div>
    );
} 