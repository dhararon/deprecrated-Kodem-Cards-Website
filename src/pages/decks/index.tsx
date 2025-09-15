import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Plus, Layers, Info, Eye, EyeOff, ArrowRight, Settings, Trash2, X, AlertTriangle, Globe } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Spinner } from '@/components/atoms/Spinner';
import { Card, CardContent, CardFooter } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { getUserDecks, deleteDeck } from '@/lib/firebase/services/deckService';
import { Deck } from '@/types/deck';
import { useAuth } from '@/hooks/useAuth';

/**
 * Page for displaying user's deck collection
 */
const Decks: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Cargar los mazos del usuario cuando se carga la página
    useEffect(() => {
        const loadDecks = async () => {
            if (!user || !user.id) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const userDecks = await getUserDecks(user.id);
                setDecks(userDecks);
            } catch (error) {
                console.error('Error al cargar mazos:', error);
                setError('Error al cargar tus mazos. Por favor, intenta de nuevo.');
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            loadDecks();
        }
    }, [user, authLoading]);

    // Formatear la fecha para mostrarla
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Fecha desconocida';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    // Manejar la apertura del modal de confirmación
    const handleDeleteClick = (deck: Deck) => {
        setDeckToDelete(deck);
        setDeleteModalOpen(true);
    };

    // Manejar el cierre del modal de confirmación
    const handleCloseModal = () => {
        setDeleteModalOpen(false);
        setDeckToDelete(null);
    };

    // Manejar la confirmación de eliminación
    const handleConfirmDelete = async () => {
        if (!deckToDelete) return;

        try {
            setIsDeleting(true);
            await deleteDeck(deckToDelete.id);
            
            // Actualizar la lista de mazos
            setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckToDelete.id));
            
            // Cerrar el modal
            handleCloseModal();
            
            // Opcional: Mostrar mensaje de éxito
            // showToast('Mazo eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar el mazo:', error);
            setError('Error al eliminar el mazo. Por favor, intenta de nuevo.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Renderizar el estado de carga
    if (authLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Spinner size="lg" className="mb-4" />
                <p className="text-muted-foreground">Cargando tus mazos...</p>
            </div>
        );
    }

    // Renderizar si hay un error
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <EmptyState
                    title="Error al cargar mazos"
                    description={error}
                    icon={<Info className="h-10 w-10 text-red-500" />}
                    action={
                        <Button
                            onClick={() => window.location.reload()}
                            className="mt-4"
                        >
                            Reintentar
                        </Button>
                    }
                />
            </div>
        );
    }

    // Renderizar si el usuario no está autenticado
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <EmptyState
                    title="Inicia sesión para ver tus mazos"
                    description="Necesitas iniciar sesión para crear y ver tus mazos"
                    icon={<Info className="h-10 w-10 text-primary/60" />}
                    action={
                        <Link href="/login">
                            <Button className="mt-4">
                                Iniciar sesión
                            </Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col p-4 w-full relative">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Mazos</h1>
                
                <div className="flex gap-2">
                    <Link href="/decks/editor/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Crear Mazo
                        </Button>
                    </Link>
                    <Link href="/decks/feed">
                        <Button variant="outline">
                            <Globe className="h-4 w-4 mr-2" />
                            Explorar Públicos
                        </Button>
                    </Link>
                </div>
            </div>

            {decks.length === 0 ? (
                <EmptyState
                    title="No tienes mazos creados"
                    description="Crea tu primer mazo para organizar tus cartas y construir estrategias"
                    icon={<Layers className="h-10 w-10 text-primary/60" />}
                    action={
                        <Link href="/decks/editor/new">
                            <Button className="mt-4">
                                Crear Mazo
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {decks.map((deck) => (
                        <Card key={deck.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="bg-gradient-to-r from-primary/30 to-primary/10 p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-semibold line-clamp-1">{deck.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {deck.cardIds.length} cartas • {formatDate(deck.updatedAt)}
                                            </p>
                                        </div>
                                        {deck.isPublic ? (
                                            <div className="flex items-center text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                                                <Eye className="h-3 w-3 mr-1" />
                                                Público
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">
                                                <EyeOff className="h-3 w-3 mr-1" />
                                                Privado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 flex justify-between">
                                <div className="flex gap-2">
                                    <Link href={`/decks/editor/${deck.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(deck)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </Button>
                                </div>
                                <Link href={`/decks/${deck.id}`}>
                                    <Button size="sm">
                                        Ver detalle
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Botón flotante para crear un nuevo mazo */}
            <Link href="/decks/editor/new">
                <button
                    className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 z-10"
                    aria-label="Crear nuevo mazo"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </Link>

            {/* Modal de confirmación para eliminar */}
            {deleteModalOpen && deckToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Eliminar mazo</h3>
                            <Button variant="ghost" size="sm" className="h-8 w-8" onClick={handleCloseModal}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-md mb-4">
                            <AlertTriangle className="h-5 w-5" />
                            <p className="text-sm">Esta acción no se puede deshacer.</p>
                        </div>
                        
                        <p className="mb-4">
                            ¿Estás seguro de que deseas eliminar el mazo <span className="font-semibold">{deckToDelete.name}</span>?
                        </p>
                        
                        <div className="flex justify-end gap-3">
                            <Button 
                                variant="outline" 
                                onClick={handleCloseModal}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Eliminando...
                                    </>
                                ) : (
                                    'Eliminar'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Decks; 