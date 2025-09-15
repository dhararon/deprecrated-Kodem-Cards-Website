import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/atoms/Card';
import { CardWithQuantity } from '@/types/collection';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/atoms/Dialog';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Separator } from '@/components/atoms/Separator';
import { Heart, Plus, Check } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { WishListPriority, AddToWishListRequest } from '@/types/wishlist';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/atoms/DropdownMenu';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/atoms/Tooltip';

interface CollectionGridProps {
    cards: CardWithQuantity[];
    cardsByRarity: Record<string, CardWithQuantity[]>;
    updateCardQuantity: (cardId: string, quantity: number) => void;
    updatingCardId: string | null;
    className?: string;
}

// Componente para una sección de rareza, optimizado con memo
const RaritySection = memo(({
    rarity,
    cards,
    updateCardQuantity,
    updatingCardId,
    expandAllSignal
}: {
    rarity: string;
    cards: CardWithQuantity[];
    updateCardQuantity: (cardId: string, quantity: number) => void;
    updatingCardId: string | null;
    expandAllSignal: boolean | null;
}) => {
    // Estado para el modal
    const [selectedCard, setSelectedCard] = useState<CardWithQuantity | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Estado para el índice de la carta seleccionada
    const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);
    // Estado para expandir/contraer la sección - por defecto contraída
    const [isExpanded, setIsExpanded] = useState(false);
    // Estado para controlar la carga progresiva de cartas
    const [itemsToShow, setItemsToShow] = useState(50);

    // Escuchar el signal de expandir/contraer todas las secciones
    useEffect(() => {
        if (expandAllSignal !== null) {
            setIsExpanded(expandAllSignal);
        }
    }, [expandAllSignal]);

    // Ordenar las cartas por número de carta
    const sortedCards = useMemo(() => {
        return [...cards].sort((a, b) => (a.mainCard.cardNumber || 0) - (b.mainCard.cardNumber || 0));
    }, [cards]);

    // Resetear itemsToShow cuando cambie la expansión
    useEffect(() => {
        if (isExpanded) {
            setItemsToShow(50); // Valor inicial cuando se expande
        }
    }, [isExpanded]);

    // Función para cargar más cartas cuando se hace scroll
    const handleLoadMore = useCallback(() => {
        if (isExpanded && itemsToShow < sortedCards.length) {
            setItemsToShow(prev => Math.min(prev + 50, sortedCards.length));
        }
    }, [isExpanded, itemsToShow, sortedCards.length]);

    // Función para abrir el modal con la carta seleccionada
    const handleCardClick = (card: CardWithQuantity) => {
        const index = sortedCards.findIndex(c => c.mainCard.id === card.mainCard.id);
        setSelectedCardIndex(index);
        setSelectedCard(card);
        setIsModalOpen(true);
    };

    // Función para navegar a la carta anterior
    const handlePrevCard = useCallback(() => {
        if (selectedCardIndex > 0) {
            const prevIndex = selectedCardIndex - 1;
            setSelectedCardIndex(prevIndex);
            setSelectedCard(sortedCards[prevIndex]);
        }
    }, [selectedCardIndex, sortedCards]);

    // Función para navegar a la carta siguiente
    const handleNextCard = useCallback(() => {
        if (selectedCardIndex < sortedCards.length - 1) {
            const nextIndex = selectedCardIndex + 1;
            setSelectedCardIndex(nextIndex);
            setSelectedCard(sortedCards[nextIndex]);
        }
    }, [selectedCardIndex, sortedCards]);
    
    // Controlar la navegación con teclado
    useEffect(() => {
        if (!isModalOpen) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsModalOpen(false);
            } else if (e.key === 'ArrowLeft') {
                handlePrevCard();
            } else if (e.key === 'ArrowRight') {
                handleNextCard();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, handlePrevCard, handleNextCard]);

    // Actualizar la carta seleccionada cuando cambie su cantidad
    useEffect(() => {
        if (selectedCard && !updatingCardId) {
            // Buscar la versión actualizada de la carta en el array de cartas
            const updatedCard = sortedCards.find(card => card.mainCard.id === selectedCard.mainCard.id);
            if (updatedCard && updatedCard.mainCard.quantity !== selectedCard.mainCard.quantity) {
                // Actualizar el estado con la nueva versión de la carta
                setSelectedCard(updatedCard);
            }
        }
    }, [sortedCards, selectedCard, updatingCardId]);

    // Función para manejar la actualización desde el modal
    const handleUpdateQuantity = (cardId: string, quantity: number) => {
        updateCardQuantity(cardId, quantity);
        
        // Actualizar también la carta seleccionada localmente para feedback inmediato
        if (selectedCard && selectedCard.mainCard.id === cardId) {
            setSelectedCard({
                ...selectedCard,
                mainCard: {
                    ...selectedCard.mainCard,
                    quantity: quantity,
                    inCollection: quantity > 0
                }
            });
        }
    };

    // Función para capitalizar la primera letra de un string
    const capitalize = (text: string) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    };
    
    // Calcular estadísticas de esta rareza
    const totalCards = sortedCards.length;
    const collectedCards = sortedCards.filter(card => card.mainCard.quantity > 0).length;
    const collectionPercentage = totalCards > 0 ? Math.round((collectedCards / totalCards) * 100) : 0;

    return (
        <div key={rarity} className="space-y-2 mb-4">
            {/* Cabecera con el botón para expandir/contraer */}
            <button
                className="w-full flex items-center justify-between border-b pb-1 hover:bg-muted/20 transition-colors rounded px-2"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls={`rarity-cards-${rarity}`}
            >
                <h3 className="text-sm font-medium capitalize flex items-center gap-2">
                    <span>{capitalize(rarity)}</span>
                    <Badge variant="outline" className="text-xs">
                        {collectedCards}/{totalCards}
                    </Badge>
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{collectionPercentage}% completado</span>
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
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
            </button>

            {/* Contenido de la sección (visible solo cuando está expandida) */}
            <div 
                id={`rarity-cards-${rarity}`}
                className={`transition-opacity duration-300 overflow-hidden ${
                    isExpanded 
                        ? "opacity-100 max-h-full"
                        : "opacity-0 max-h-0"
                }`}
            >
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3 md:gap-4 auto-rows-[min-content]">
                    {sortedCards.slice(0, itemsToShow).map((cardGroup) => (
                        <CardItem
                            key={cardGroup.mainCard.id}
                            cardGroup={cardGroup}
                            updateCardQuantity={updateCardQuantity}
                            updatingCardId={updatingCardId}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>
                
                {/* Trigger para cargar más cartas */}
                {isExpanded && sortedCards.length > itemsToShow && (
                    <div 
                        id={`load-more-${rarity}`} 
                        className="py-4 text-center text-sm text-muted-foreground"
                        onClick={handleLoadMore}
                    >
                        Cargando más cartas...
                    </div>
                )}
            </div>

            {/* Modal para ver detalles de la carta con navegación */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white p-3 sm:p-5 overflow-x-hidden overflow-y-auto 
                    w-[92vw] sm:w-[470px] pb-16 sm:pb-5 max-h-[90vh] sm:max-h-[650px] flex flex-col modal-mobile-height">
                    {/* Botones de navegación (solo desktop) */}
                    {selectedCardIndex > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-12 w-12 rounded-full shadow-lg bg-white border-2 border-primary/30 hover:bg-primary/10 z-[100] opacity-95 hover:opacity-100 hidden sm:flex items-center justify-center"
                            onClick={handlePrevCard}
                            aria-label="Carta anterior"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </Button>
                    )}
                    
                    {selectedCardIndex < sortedCards.length - 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-12 w-12 rounded-full shadow-lg bg-white border-2 border-primary/30 hover:bg-primary/10 z-[100] opacity-95 hover:opacity-100 hidden sm:flex items-center justify-center"
                            onClick={handleNextCard}
                            aria-label="Carta siguiente"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </Button>
                    )}
                    
                    {/* Bottom Navigation Bar (solo mobile) */}
                    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4 sm:hidden z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                        {/* Botón Anterior */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "flex flex-col items-center gap-0.5 h-auto py-1 px-6",
                              selectedCardIndex <= 0 ? "opacity-50 pointer-events-none text-gray-400" : "text-primary"
                            )}
                            onClick={handlePrevCard}
                            disabled={selectedCardIndex <= 0}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mb-0.5"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            <span className="text-xs font-medium">Anterior</span>
                        </Button>
                        
                        {/* Indicador de posición */}
                        <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                                {selectedCardIndex + 1} / {sortedCards.length}
                            </span>
                        </div>
                        
                        {/* Botón Siguiente */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "flex flex-col items-center gap-0.5 h-auto py-1 px-6",
                              selectedCardIndex >= sortedCards.length - 1 ? "opacity-50 pointer-events-none text-gray-400" : "text-primary"
                            )}
                            onClick={handleNextCard}
                            disabled={selectedCardIndex >= sortedCards.length - 1}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mb-0.5"
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                            <span className="text-xs font-medium">Siguiente</span>
                        </Button>
                    </div>
                    
                    {/* Contenido del modal */}
                    {selectedCard && (
                        <div className="flex flex-col w-full max-w-full">
                            <DialogHeader className="mb-2 sm:mb-4">
                                <DialogTitle className="text-base sm:text-xl text-center text-black truncate">{selectedCard.mainCard.name}</DialogTitle>
                                <div className="flex justify-center gap-2 mt-1 flex-wrap">
                                    {selectedCard.mainCard.rarity && (
                                        <Badge variant="outline" className="capitalize text-xs text-black border-black/20">
                                            {selectedCard.mainCard.rarity}
                                        </Badge>
                                    )}
                                    {selectedCard.mainCard.type && (
                                        <Badge variant="outline" className="capitalize text-xs text-black border-black/20">
                                            {selectedCard.mainCard.type}
                                        </Badge>
                                    )}
                                </div>
                                
                                {/* Indicador de posición (solo desktop) */}
                                <div className="text-xs text-muted-foreground text-center mt-1 hidden sm:flex items-center justify-center gap-2">
                                    <span>Carta {selectedCardIndex + 1} de {sortedCards.length}</span>
                                </div>
                            </DialogHeader>

                            {/* Contenedor principal con scroll */}
                            <div className="flex flex-col overflow-y-auto flex-grow custom-scrollbar max-h-[calc(90vh-140px)] sm:max-h-none">
                                {/* Imagen con altura adaptativa */}
                                <div className="mb-2 mx-auto flex-shrink-0 modal-image-container">
                                    <Card className="overflow-hidden border-none shadow-md sm:w-[280px] mx-auto">
                                        <CardContent className="p-0">
                                            {selectedCard.mainCard.imageUrl ? (
                                                <img
                                                    src={selectedCard.mainCard.imageUrl}
                                                    alt={selectedCard.mainCard.name}
                                                    className="w-full object-contain max-h-[40vh] sm:max-h-[420px]"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center max-h-[40vh] sm:max-h-[420px]">
                                                    <span className="text-muted-foreground">Sin imagen</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Separator className="my-2 sm:my-3 bg-black/10" />

                                {/* Información detallada - altura flexible */}
                                <div className="space-y-2 sm:space-y-3 overflow-y-auto">
                                    {/* Información detallada */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-black max-w-full overflow-hidden">
                                        {selectedCard.mainCard.cardNumber !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="font-medium">Número:</span>
                                                <span>#{selectedCard.mainCard.cardNumber}</span>
                                            </div>
                                        )}
                                        {selectedCard.mainCard.cardSet && (
                                            <div className="flex justify-between">
                                                <span className="font-medium">Set:</span>
                                                <span className="capitalize truncate ml-1">{selectedCard.mainCard.cardSet}</span>
                                            </div>
                                        )}
                                        {selectedCard.mainCard.energy && (
                                            <div className="flex justify-between">
                                                <span className="font-medium">Energía:</span>
                                                <span className="capitalize">{selectedCard.mainCard.energy}</span>
                                            </div>
                                        )}
                                        {selectedCard.mainCard.power !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="font-medium">Daño:</span>
                                                <span>{selectedCard.mainCard.power}</span>
                                            </div>
                                        )}
                                        {selectedCard.mainCard.sleep !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="font-medium">Descanso:</span>
                                                <span>{selectedCard.mainCard.sleep}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Descripción */}
                                    {selectedCard.mainCard.description && (
                                        <Card className="bg-muted/20 max-w-full overflow-hidden">
                                            <CardContent className="p-2 sm:p-3">
                                                <p className="text-xs sm:text-sm italic text-black break-words">{selectedCard.mainCard.description}</p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Reglas - colapsables en móvil */}
                                    {selectedCard.mainCard.rules && selectedCard.mainCard.rules.length > 0 && (
                                        <details className="text-xs sm:text-sm text-black max-w-full overflow-hidden">
                                            <summary className="font-medium cursor-pointer p-1">
                                                Reglas ({selectedCard.mainCard.rules.length})
                                            </summary>
                                            <ul className="list-disc list-inside space-y-1 mt-1 pl-2 break-words">
                                                {selectedCard.mainCard.rules.map((rule, index) => (
                                                    <li key={index} className="break-words">{rule}</li>
                                                ))}
                                            </ul>
                                        </details>
                                    )}

                                    {/* Artista */}
                                    {selectedCard.mainCard.artist && selectedCard.mainCard.artist.length > 0 && (
                                        <div className="text-xs text-right truncate">
                                            <span className="text-black/60">Ilustrado por: {selectedCard.mainCard.artist.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-2 sm:my-3 bg-black/10" />

                            {/* Controles de cantidad */}
                            <div className="flex justify-center items-center gap-2 sm:gap-3 max-w-full mt-auto pt-2">
                                <span className="text-xs sm:text-sm text-black">Cantidad:</span>
                                <div className="flex items-center">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 rounded-r-none text-black border-black/20"
                                        disabled={updatingCardId === selectedCard.mainCard.id || selectedCard.mainCard.quantity <= 0}
                                        onClick={() => handleUpdateQuantity(selectedCard.mainCard.id, Math.max(0, selectedCard.mainCard.quantity - 1))}
                                    >
                                        -
                                    </Button>
                                    <span className={cn(
                                        "inline-flex h-8 min-w-[2rem] items-center justify-center text-sm border-y px-2 border-black/20",
                                        selectedCard.mainCard.quantity > 0
                                            ? "bg-green-50 text-green-900 border-green-200"
                                            : "bg-muted text-black"
                                    )}>
                                        {selectedCard.mainCard.quantity}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 rounded-l-none text-black border-black/20"
                                        disabled={updatingCardId === selectedCard.mainCard.id}
                                        onClick={() => handleUpdateQuantity(selectedCard.mainCard.id, selectedCard.mainCard.quantity + 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
});

RaritySection.displayName = 'RaritySection';

interface CardItemProps {
    cardGroup: CardWithQuantity;
    updateCardQuantity: (cardId: string, quantity: number) => void;
    updatingCardId: string | null;
    onCardClick: (card: CardWithQuantity) => void;
}

// Componente para una carta individual
const CardItem = memo(({
    cardGroup,
    updateCardQuantity,
    updatingCardId,
    onCardClick
}: CardItemProps) => {
    const card = cardGroup.mainCard;
    const isUpdating = updatingCardId === card.id;
    
    // Acceder al contexto de listas de deseos
    const { 
        userWishlists, 
        isCardInWishlists, 
        addCardToWishlist, 
        removeCardFromWishlist 
    } = useWishlist();
    
    // Comprobar si la carta está en alguna lista
    const { inWishlist, wishlists } = isCardInWishlists(card.id);
    
    // Manejar clic en la carta
    const handleCardClick = () => {
        onCardClick(cardGroup);
    };
    
    // Incrementar cantidad de carta
    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isUpdating) {
            updateCardQuantity(card.id, card.quantity + 1);
        }
    };
    
    // Decrementar cantidad de carta
    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isUpdating && card.quantity > 0) {
            updateCardQuantity(card.id, card.quantity - 1);
        }
    };
    
    // Agregar a lista de deseos
    const handleAddToWishlist = async (wishlistId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        const request: AddToWishListRequest = {
            wishlistId,
            cardId: card.id,
            priority: WishListPriority.MEDIUM
        };
        
        try {
            await addCardToWishlist(request);
        } catch (error) {
            console.error('Error al agregar carta a la lista de deseos:', error);
        }
    };
    
    // Eliminar de una lista de deseos
    const handleRemoveFromWishlist = async (wishlistId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            await removeCardFromWishlist(wishlistId, card.id);
        } catch (error) {
            console.error('Error al eliminar carta de la lista de deseos:', error);
        }
    };
    
    // Evitar la propagación del clic al menú
    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };
    
    return (
        <div className="relative h-full">
            <div
                onClick={handleCardClick}
                className={cn(
                    "w-full h-full text-left border rounded-lg overflow-hidden shadow-sm group cursor-pointer",
                    "transition-all duration-200 ease-in-out",
                    card.inCollection ? "bg-white" : "bg-muted/30",
                    "flex flex-col"
                )}
                role="button"
                tabIndex={0}
                aria-disabled={isUpdating}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick();
                    }
                }}
            >
                {/* Superposición de carga durante actualización */}
                {isUpdating && (
                    <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center rounded-lg">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                
                {/* Imagen de la carta */}
                <div className="relative aspect-[2/3] bg-black/5 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src={card.imageUrl || '/images/card-back.png'}
                            alt={card.name}
                            className="object-contain w-full h-full"
                            loading="lazy"
                        />
                    </div>
                    
                    {/* Etiquetas en la esquina */}
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
                        {/* Etiqueta de rareza */}
                        {card.rarity && (
                            <Badge
                                variant="secondary"
                                className="bg-black/70 text-white text-xs py-1 px-2 capitalize pointer-events-none"
                            >
                                {card.rarity}
                            </Badge>
                        )}
                        
                        {/* Indicador de lista de deseos */}
                        {inWishlist && (
                            <Badge
                                variant="secondary"
                                className="bg-primary/80 text-white text-xs py-1 px-2 pointer-events-none"
                            >
                                <Heart size={12} className="mr-1" />
                                Deseada
                            </Badge>
                        )}
                    </div>
                </div>
                
                {/* Información mínima de la carta */}
                <div className="p-3 text-sm text-left flex-grow flex flex-col justify-between bg-gradient-to-b from-transparent to-muted/10">
                    <p className="font-medium truncate mb-1.5 leading-tight" title={card.name}>
                        {card.name}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto">
                        {/* Energia si aplica */}
                        {card.energy && (
                            <span className="text-xs text-muted-foreground capitalize truncate">
                                {card.energy}
                            </span>
                        )}
                        
                        {/* Controles de cantidad */}
                        <div className="ml-auto flex items-center gap-1.5">
                            <button
                                onClick={handleDecrement}
                                className={cn(
                                    "w-7 h-7 flex items-center justify-center rounded-full text-xs border",
                                    "transition-colors",
                                    card.quantity > 0
                                        ? "bg-white text-primary border-primary hover:bg-primary/10 active:bg-primary/20 pointer-events-auto"
                                        : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                                )}
                                disabled={isUpdating || card.quantity <= 0}
                                aria-label="Disminuir cantidad"
                            >
                                -
                            </button>
                            
                            <Badge 
                                variant={card.quantity > 0 ? "secondary" : "outline"}
                                className={cn(
                                    "text-xs py-0.5 px-2 h-auto min-w-[1.5rem] flex items-center justify-center",
                                    card.quantity > 0 
                                        ? "bg-primary/10 text-primary" 
                                        : "border-muted-foreground/30 text-muted-foreground"
                                )}
                            >
                                {card.quantity}
                            </Badge>
                            
                            <button
                                onClick={handleIncrement}
                                className={cn(
                                    "w-7 h-7 flex items-center justify-center rounded-full text-xs border",
                                    "pointer-events-auto bg-white text-primary border-primary",
                                    "hover:bg-primary/10 active:bg-primary/20 transition-colors"
                                )}
                                disabled={isUpdating}
                                aria-label="Aumentar cantidad"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Botón flotante para agregar a lista de deseos */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute bottom-2 left-2 z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-9 w-9 rounded-full shadow-md bg-white hover:bg-white hover:text-primary"
                                    >
                                        <Heart
                                            size={18}
                                            className={inWishlist ? "fill-primary text-red-500" : "text-red-500"}
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56 bg-white">
                                    <DropdownMenuLabel>Añadir a lista de deseos</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {userWishlists.length === 0 ? (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            No tienes listas de deseos. Crea una en la sección de Listas.
                                        </div>
                                    ) : (
                                        userWishlists.map(list => {
                                            const isInList = wishlists.includes(list.id);
                                            return (
                                                <DropdownMenuItem
                                                    key={list.id}
                                                    className="flex items-center justify-between cursor-pointer"
                                                    onClick={isInList
                                                        ? (e) => handleRemoveFromWishlist(list.id, e)
                                                        : (e) => handleAddToWishlist(list.id, e)
                                                    }
                                                >
                                                    <span>{list.name}</span>
                                                    {isInList ? (
                                                        <Check size={16} className="text-primary" />
                                                    ) : (
                                                        <Plus size={16} />
                                                    )}
                                                </DropdownMenuItem>
                                            );
                                        })
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white">
                        Lista de deseos
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
});

CardItem.displayName = 'CardItem';

/**
 * CollectionGrid - Componente para mostrar una cuadrícula de cartas de colección
 */
export const CollectionGrid = memo(function CollectionGrid({
    cards,
    cardsByRarity,
    updateCardQuantity,
    updatingCardId,
    className
}: Omit<CollectionGridProps, 'title'>) {
    // Estado para expandir/contraer todas las secciones
    const [allExpanded, setAllExpanded] = useState(false);
    
    // Ordenar rarezas por orden lógico: de más rara a menos rara
    const getSortedRarities = (): string[] => {
        // Definir orden de rarezas (ajustar según necesidades)
        const rarityOrder = ['mythic', 'ultra_rare', 'rare', 'uncommon', 'common'];

        // Obtener todas las rarezas disponibles
        const availableRarities = Object.keys(cardsByRarity);

        // Ordenar basado en el orden definido
        return availableRarities.sort((a, b) => {
            const indexA = rarityOrder.indexOf(a);
            const indexB = rarityOrder.indexOf(b);

            // Si ambos existen en el orden predefinido
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }

            // Si solo uno existe, priorizarlo
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // Si ninguno existe en el orden predefinido, orden alfabético
            return a.localeCompare(b);
        });
    };

    // Obtener rarezas ordenadas
    const sortedRarities = getSortedRarities();
    
    // Calcular estadísticas de colección
    const totalCards = cards.length;
    const collectedCards = cards.filter(card => card.mainCard.quantity > 0).length;
    const collectionPercentage = totalCards > 0 ? Math.round((collectedCards / totalCards) * 100) : 0;

    // Referencia al evento personalizado para expandir/contraer secciones
    const [expandAll, setExpandAll] = useState<boolean | null>(null);

    // Función para expandir o contraer todas las secciones
    const toggleAllSections = () => {
        const newExpandState = !allExpanded;
        setAllExpanded(newExpandState);
        setExpandAll(newExpandState);
    };

    return (
        <div className={cn("space-y-4", className)}>
            {cards.length === 0 ? (
                <div className="p-4 sm:p-6 text-center rounded-lg border border-border bg-card">
                    <h3 className="text-base sm:text-lg font-medium mb-2">No hay cartas para mostrar</h3>
                    <p className="text-sm text-muted-foreground">
                        Ajusta los filtros o selecciona otro set
                    </p>
                </div>
            ) : (
                <>
                    {/* Contador total de cartas */}
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg border border-border">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <h3 className="text-sm font-medium">Total cartas: {totalCards}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Coleccionadas: {collectedCards}</span>
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                    {collectionPercentage}%
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Botón para expandir/contraer todas las secciones */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={toggleAllSections}
                            className="text-xs h-8"
                        >
                            {allExpanded ? "Contraer todo" : "Expandir todo"}
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="14" 
                                height="14" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className={`ml-1 transition-transform ${allExpanded ? "rotate-180" : ""}`}
                            >
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </Button>
                    </div>
                    
                    {/* Mostrar secciones por rareza */}
                    {sortedRarities.map((rarity) => (
                        <RaritySection
                            key={rarity}
                            rarity={rarity}
                            cards={cardsByRarity[rarity] || []}
                            updateCardQuantity={updateCardQuantity}
                            updatingCardId={updatingCardId}
                            expandAllSignal={expandAll}
                        />
                    ))}
                </>
            )}
        </div>
    );
});

export default CollectionGrid; 