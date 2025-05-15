import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { Spinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/atoms/Button';
import { Edit, ArrowLeft, Trash, Copy, Check, X, Printer } from 'lucide-react';
import { EnrichedWishListCard, WishList } from '@/types/wishlist';
import { Textarea } from '@/components/atoms/Textarea';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Image } from '@/components/atoms/Image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/atoms/Select';
import { toast } from 'sonner';

// Custom Hooks
function useWishlistData(id: string) {
    const [isLoading, setIsLoading] = useState(true);
    const [cards, setCards] = useState<EnrichedWishListCard[]>([]);
    const {
        selectedWishlist,
        selectWishlist,
        getEnrichedCards,
        updateWishlist,
        removeCardFromWishlist,
        loading,
    } = useWishlist();
    const navigate = useLocation()[1];

    // Cargar la lista específica cuando cambie el ID
    useEffect(() => {
        const loadWishlist = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                await selectWishlist(id);
            } catch (error) {
                console.error('Error al cargar la lista:', error);
                navigate('/wishlists');
            } finally {
                setIsLoading(false);
            }
        };

        loadWishlist();
    }, [id, selectWishlist, navigate]);

    // Cargar las cartas de la lista
    useEffect(() => {
        const loadCards = async () => {
            if (!id) return;

            try {
                const enrichedCards = await getEnrichedCards(id);
                setCards(enrichedCards);
            } catch (error) {
                console.error('Error al cargar las cartas:', error);
            }
        };

        loadCards();
    }, [id, getEnrichedCards]);

    // Eliminar carta de la lista
    const handleRemoveCard = async (cardId: string) => {
        if (!selectedWishlist) return;

        if (window.confirm('¿Estás seguro de que deseas eliminar esta carta de la lista?')) {
            try {
                await removeCardFromWishlist(selectedWishlist.id, cardId);
                // Actualizar la lista local de cartas
                setCards(prev => prev.filter(card => card.wishlistData.cardId !== cardId));
            } catch (error) {
                console.error('Error al eliminar la carta:', error);
            }
        }
    };

    return {
        isLoading: isLoading || loading,
        cards,
        selectedWishlist,
        updateWishlist,
        handleRemoveCard
    };
}

function useWishlistDetails(wishlist: WishList | null) {
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [listDetails, setListDetails] = useState({
        name: '',
        description: ''
    });

    // Actualizar los detalles cuando cambie la wishlist
    useEffect(() => {
        if (wishlist) {
            setListDetails({
                name: wishlist.name,
                description: wishlist.description || ''
            });
        }
    }, [wishlist]);

    // Manejar cambios en los detalles
    const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setListDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return {
        isEditingDetails,
        setIsEditingDetails,
        listDetails,
        handleDetailsChange
    };
}

function useFullscreenViewer() {
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [fullscreenCardName, setFullscreenCardName] = useState<string>('');
    const [fullscreenSetName, setFullscreenSetName] = useState<string>('');
    const [fullscreenFullId, setFullscreenFullId] = useState<string>('');
    const [fullscreenRarity, setFullscreenRarity] = useState<string>('');

    // Cerrar visor a pantalla completa
    const handleCloseFullscreen = () => {
        setFullscreenImage(null);
        setFullscreenCardName('');
        setFullscreenSetName('');
        setFullscreenFullId('');
        setFullscreenRarity('');
    };

    // Bloquear scroll cuando está en pantalla completa
    useEffect(() => {
        if (fullscreenImage) {
            document.body.style.overflow = 'hidden';

            // Añadir event listener para la tecla ESC
            const handleEscKeyPress = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    handleCloseFullscreen();
                }
            };

            // Agregar el event listener al document
            document.addEventListener('keydown', handleEscKeyPress);

            // Limpiar event listener al desmontar
            return () => {
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscKeyPress);
            };
        } else {
            document.body.style.overflow = '';

            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [fullscreenImage]);

    // Abrir visor a pantalla completa
    const handleOpenFullscreen = (imageUrl: string | undefined, card: EnrichedWishListCard) => {
        if (imageUrl) {
            setFullscreenImage(imageUrl);
            setFullscreenCardName(card.cardDetails.name);
            setFullscreenSetName(card.cardDetails.setName || card.cardDetails.cardSet || '');
            setFullscreenFullId(card.cardDetails.fullId || '');
            setFullscreenRarity(card.cardDetails.rarity || '');
        }
    };

    return {
        fullscreenImage,
        fullscreenCardName,
        fullscreenSetName,
        fullscreenFullId,
        fullscreenRarity,
        handleOpenFullscreen,
        handleCloseFullscreen
    };
}

function useClipboard() {
    const [shareOption, setShareOption] = useState<string>('url');
    const [copied, setCopied] = useState(false);

    const handleCopyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Copiado al portapapeles');

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error('Error al copiar:', error);
            toast.error('No se pudo copiar al portapapeles');
        }
    };

    return {
        shareOption,
        setShareOption,
        copied,
        handleCopyToClipboard
    };
}

// Custom hook para impresión
function usePrintWishlist() {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return {
        printRef,
        handlePrint
    };
}

// Componentes Atómicos
const CardFullscreenViewer = React.memo(({
    image,
    name,
    setName,
    fullId,
    rarity,
    onClose
}: {
    image: string | null;
    name: string;
    setName: string;
    fullId: string;
    rarity: string;
    onClose: () => void;
}) => {
    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
                <Button
                    variant="ghost"
                    className="absolute top-0 right-0 text-white z-10 p-1 h-auto w-auto m-2 rounded-full bg-black/50 hover:bg-black/70"
                    onClick={onClose}
                >
                    <X size={24} />
                </Button>

                <div className="relative w-full h-auto max-h-[80vh] overflow-hidden flex items-center justify-center">
                    <img
                        src={image}
                        alt={name}
                        className="object-contain max-h-[80vh] max-w-full rounded-lg"
                    />
                </div>

                <div className="text-white text-center mt-4 space-y-1">
                    <p className="font-medium text-xl">{name}</p>
                    <p className="text-sm text-gray-300">
                        <span className="capitalize">{rarity}</span> •
                        <span className="capitalize"> {setName}</span>
                        {fullId && <span> • ID: {fullId}</span>}
                    </p>
                </div>
            </div>
        </div>
    );
});

CardFullscreenViewer.displayName = 'CardFullscreenViewer';

// Componentes Moleculares
const ShareOptions = React.memo(({
    shareOption,
    onShareOptionChange,
    onCopy,
    copied,
    onPrint
}: {
    shareOption: string;
    onShareOptionChange: (value: string) => void;
    onCopy: () => void;
    copied: boolean;
    onPrint: () => void;
}) => {
    return (
        <div className="flex items-center gap-2">
            <Select value={shareOption} onValueChange={onShareOptionChange}>
                <SelectTrigger className="w-36 sm:w-40 h-10">
                    <SelectValue placeholder="Compartir..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="url">URL completa</SelectItem>
                    <SelectItem value="id">Solo ID</SelectItem>
                </SelectContent>
            </Select>

            <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                className="h-10 w-10"
            >
                {copied ?
                    <Check className="h-4 w-4 text-green-600" /> :
                    <Copy className="h-4 w-4" />
                }
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="h-10 w-10 print:hidden"
                title="Imprimir lista"
            >
                <Printer className="h-4 w-4" />
            </Button>
        </div>
    );
});

ShareOptions.displayName = 'ShareOptions';

const WishlistEditForm = React.memo(({
    details,
    onChange,
    onSave,
    onCancel
}: {
    details: { name: string; description: string };
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSave: () => void;
    onCancel: () => void;
}) => {
    return (
        <div className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
            <div>
                <Label htmlFor="name" className="text-base mb-1.5 block">Nombre de la lista</Label>
                <Input
                    id="name"
                    name="name"
                    value={details.name}
                    onChange={onChange}
                    className="mt-1 h-11 text-base"
                />
            </div>
            <div>
                <Label htmlFor="description" className="text-base mb-1.5 block">Descripción</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={details.description}
                    onChange={onChange}
                    rows={3}
                    className="mt-1 text-base"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={onCancel}
                    className="h-11"
                >
                    Cancelar
                </Button>
                <Button
                    size="lg"
                    onClick={onSave}
                    className="h-11"
                >
                    Guardar
                </Button>
            </div>
        </div>
    );
});

WishlistEditForm.displayName = 'WishlistEditForm';

const WishlistHeader = React.memo(({
    wishlist,
    isEditing,
    details,
    onDetailsChange,
    onSaveDetails,
    onCancelEdit,
    onStartEdit,
    onBack
}: {
    wishlist: WishList;
    isEditing: boolean;
    details: { name: string; description: string };
    onDetailsChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSaveDetails: () => void;
    onCancelEdit: () => void;
    onStartEdit: () => void;
    onBack: () => void;
}) => {
    return (
        <div className="mb-6">
            <Button
                variant="ghost"
                onClick={onBack}
                className="mb-3 -ml-2 p-2 h-auto"
                size="lg"
            >
                <ArrowLeft size={20} className="mr-2" />
                <span className="text-base">Volver a mis listas</span>
            </Button>

            {isEditing ? (
                <WishlistEditForm
                    details={details}
                    onChange={onDetailsChange}
                    onSave={onSaveDetails}
                    onCancel={onCancelEdit}
                />
            ) : (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">{wishlist.name}</h1>
                        {wishlist.description && (
                            <p className="text-muted-foreground mt-2 text-sm sm:text-base">{wishlist.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0 self-end sm:self-auto">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={onStartEdit}
                            className="flex items-center gap-2 h-11"
                        >
                            <Edit size={18} />
                            <span className="inline text-base">Editar</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});

WishlistHeader.displayName = 'WishlistHeader';

// Componentes Organísmicos
const CardThumbnail = React.memo(({
    card,
    onOpenFullscreen,
    onRemove
}: {
    card: EnrichedWishListCard;
    onOpenFullscreen: (imageUrl: string | undefined, card: EnrichedWishListCard) => void;
    onRemove: (cardId: string) => void;
}) => {
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(card.wishlistData.cardId);
    };

    return (
        <div className="flex flex-col bg-white shadow-sm rounded-lg overflow-hidden">
            <div
                className="relative aspect-[3/4]"
                onClick={() => onOpenFullscreen(card.cardDetails.imageUrl, card)}
            >
                <Image
                    src={card.cardDetails.imageUrl || '/placeholder-card.png'}
                    alt={card.cardDetails.name}
                    className="object-cover cursor-pointer"
                />

                {/* Botón para eliminar */}
                <div className="absolute top-1 right-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveClick}
                        className="h-6 w-6 rounded-full bg-white/80 text-destructive"
                    >
                        <Trash size={12} />
                    </Button>
                </div>
            </div>

            <div className="p-1 text-center">
                <p className="text-xs font-medium truncate">{card.cardDetails.name}</p>
            </div>
        </div>
    );
});

CardThumbnail.displayName = 'CardThumbnail';

const CardGrid = React.memo(({
    cards,
    limit = Infinity,
    onOpenFullscreen,
    onRemoveCard
}: {
    cards: EnrichedWishListCard[];
    limit?: number;
    onOpenFullscreen: (imageUrl: string | undefined, card: EnrichedWishListCard) => void;
    onRemoveCard: (cardId: string) => void;
}) => {
    const visibleCards = limit < Infinity ? cards.slice(0, limit) : cards;
    const totalCards = cards.length;

    return (
        <div>
            {limit < Infinity && totalCards > limit && (
                <div className="mb-4">
                    <h2 className="text-xl font-medium">
                        Mostrando {limit} de {totalCards} cartas
                    </h2>
                </div>
            )}

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                {visibleCards.map(card => (
                    <CardThumbnail
                        key={card.wishlistData.cardId}
                        card={card}
                        onOpenFullscreen={onOpenFullscreen}
                        onRemove={onRemoveCard}
                    />
                ))}
            </div>
        </div>
    );
});

CardGrid.displayName = 'CardGrid';

// Componente para versión imprimible de las cartas
const PrintableWishlist = React.memo(({
    wishlist,
    cards
}: {
    wishlist: WishList;
    cards: EnrichedWishListCard[];
}) => {
    return (
        <div className="hidden print:block print:p-0">
            <div className="print:mb-4">
                <h1 className="text-2xl font-bold text-center">{wishlist.name} - https://kodemcards.xyz/</h1>
                {wishlist.description && (
                    <p className="text-center text-muted-foreground mt-2">{wishlist.description}</p>
                )}
            </div>

            <div className="print:grid print:grid-cols-6 print:gap-2">
                {cards.map(card => (
                    <div key={card.wishlistData.cardId} className="print:break-inside-avoid print:mb-2 print:flex print:flex-col print:items-center">
                        <div className="print:w-full print:aspect-[3/4] print:relative">
                            <img
                                src={card.cardDetails.imageUrl || '/placeholder-card.png'}
                                alt={card.cardDetails.name}
                                className="print:object-contain print:h-full print:max-w-full"
                            />
                        </div>
                        <p className="print:text-xs print:mt-1 print:text-center print:font-medium">{card.cardDetails.name}</p>
                        <p className="print:text-xs print:mt-1 print:text-center print:font-medium">{card.cardDetails.setName}</p>
                        <p className="print:text-xs print:mt-1 print:text-center print:font-medium">{card.cardDetails.fullId}</p>
                    </div>
                ))}
            </div>
        </div>
    );
});

PrintableWishlist.displayName = 'PrintableWishlist';

/**
 * WishlistDetail - Página de detalle de una lista de deseos
 * @returns Componente React
 */
export default function WishlistDetail() {
    const [location, navigate] = useLocation();
    const id = location.split('/').pop() || '';
    const { user } = useAuth();

    // Custom hooks
    const {
        isLoading,
        cards,
        selectedWishlist,
        updateWishlist,
        handleRemoveCard
    } = useWishlistData(id);

    const {
        isEditingDetails,
        setIsEditingDetails,
        listDetails,
        handleDetailsChange
    } = useWishlistDetails(selectedWishlist);

    const {
        fullscreenImage,
        fullscreenCardName,
        fullscreenSetName,
        fullscreenFullId,
        fullscreenRarity,
        handleOpenFullscreen,
        handleCloseFullscreen
    } = useFullscreenViewer();

    const {
        shareOption,
        setShareOption,
        copied,
        handleCopyToClipboard
    } = useClipboard();

    const { handlePrint } = usePrintWishlist();

    // Manejar navegación
    const handleBack = () => navigate('/wishlists');

    // Guardar cambios en detalles
    const handleSaveDetails = async () => {
        if (!selectedWishlist) return;

        try {
            await updateWishlist(selectedWishlist.id, {
                name: listDetails.name,
                description: listDetails.description
            });
            setIsEditingDetails(false);
        } catch (error) {
            console.error('Error al guardar los detalles:', error);
        }
    };

    // Manejar cancelación de edición
    const handleCancelEdit = () => {
        if (selectedWishlist) {
            setIsEditingDetails(false);
        }
    };

    // Copiar URL o ID según opción seleccionada
    const copyToClipboard = () => {
        if (!selectedWishlist) return;

        let textToCopy = window.location.href;

        if (shareOption === 'id') {
            textToCopy = id;
        }

        handleCopyToClipboard(textToCopy);
    };

    // Estado para scroll infinito
    const [visibleCount, setVisibleCount] = useState(20);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Resetear visibleCount cuando cambian las cartas
    useEffect(() => {
        setVisibleCount(20);
    }, [cards]);

    // Scroll infinito con IntersectionObserver
    useEffect(() => {
        if (!loaderRef.current) return;
        const observer = new window.IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + 20, cards.length));
            }
        });
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [cards.length]);

    // Si no hay usuario autenticado, mostrar mensaje
    if (!user) {
        return (
            <EmptyState
                title="Acceso no autorizado"
                description="Debes iniciar sesión para ver tus listas de deseos"
                icon="lock"
            />
        );
    }

    // Si está cargando, mostrar spinner
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    // Si no hay lista seleccionada, mostrar mensaje de error
    if (!selectedWishlist) {
        return (
            <EmptyState
                title="Lista no encontrada"
                description="La lista que buscas no existe o no tienes acceso a ella"
                icon="error"
                action={
                    <Button onClick={handleBack} variant="outline" className="mt-4">
                        Volver a mis listas
                    </Button>
                }
            />
        );
    }

    return (
        <div className="px-3 py-4 sm:container sm:px-4 sm:py-6 max-w-7xl mx-auto">
            {/* Estilos para impresión */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print\\:block, .print\\:block * {
                            visibility: visible;
                        }
                        .print\\:block {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 15px;
                        }
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                    }
                `
            }} />

            {/* Visualizador de imagen a pantalla completa */}
            <CardFullscreenViewer
                image={fullscreenImage}
                name={fullscreenCardName}
                setName={fullscreenSetName}
                fullId={fullscreenFullId}
                rarity={fullscreenRarity}
                onClose={handleCloseFullscreen}
            />

            {/* Cabecera con opciones de compartir */}
            <div className="flex justify-end items-center mb-3">
                <ShareOptions
                    shareOption={shareOption}
                    onShareOptionChange={setShareOption}
                    onCopy={copyToClipboard}
                    copied={copied}
                    onPrint={handlePrint}
                />
            </div>

            {/* Información de la wishlist con opciones de edición */}
            <WishlistHeader
                wishlist={selectedWishlist}
                isEditing={isEditingDetails}
                details={listDetails}
                onDetailsChange={handleDetailsChange}
                onSaveDetails={handleSaveDetails}
                onCancelEdit={handleCancelEdit}
                onStartEdit={() => setIsEditingDetails(true)}
                onBack={handleBack}
            />

            {/* Contenido principal - Grid de cartas */}
            {cards.length === 0 ? (
                <EmptyState
                    title="No hay cartas en esta lista"
                    description="Agrega cartas a esta lista desde la página de tu colección"
                    icon="heart"
                />
            ) : (
                <>
                    {/* Vista móvil - Grid con 3 cartas por fila y scroll infinito */}
                    <div className="md:hidden">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-medium">{cards.length} {cards.length === 1 ? 'carta' : 'cartas'}</h2>
                        </div>

                        <CardGrid
                            cards={cards.slice(0, visibleCount)}
                            onOpenFullscreen={handleOpenFullscreen}
                            onRemoveCard={handleRemoveCard}
                        />
                        {visibleCount < cards.length && (
                            <div ref={loaderRef} className="h-8 flex items-center justify-center">
                                <Spinner size="sm" />
                                <span className="ml-2 text-xs text-muted-foreground">Cargando más cartas...</span>
                            </div>
                        )}
                    </div>

                    {/* Vista desktop - Grid de cartas con scroll infinito */}
                    <div className="hidden md:block">
                        <CardGrid
                            cards={cards.slice(0, visibleCount)}
                            onOpenFullscreen={handleOpenFullscreen}
                            onRemoveCard={handleRemoveCard}
                        />
                        {visibleCount < cards.length && (
                            <div ref={loaderRef} className="h-8 flex items-center justify-center">
                                <Spinner size="sm" />
                                <span className="ml-2 text-xs text-muted-foreground">Cargando más cartas...</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Versión imprimible de la wishlist */}
            {selectedWishlist && cards.length > 0 && (
                <PrintableWishlist
                    wishlist={selectedWishlist}
                    cards={cards}
                />
            )}
        </div>
    );
}