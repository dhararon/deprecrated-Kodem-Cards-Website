import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
    RefreshCw,
    ChevronLeft,
    Heart,
    Share2,
    User,
    Clock,
    LayoutGrid,
    Eye,
    Filter
} from 'lucide-react';

// Componentes atómicos
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardFooter } from '@/components/atoms/Card';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';
import { Input } from '@/components/atoms/Input';

// Componentes moleculares
import { EmptyState } from '@/components/molecules/EmptyState';

// Tipos y servicios
import { Deck } from '@/types/deck';
import { getAllPublicDecks } from '@/lib/firebase/services/deckService';

/**
 * Página que muestra un feed estilo Twitter con todos los mazos públicos
 */
const DecksFeed: React.FC = () => {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Usar desestructuración para obtener solo lo que necesitamos
    const [, navigate] = useLocation();

    // Estado para filtros
    const [filter, setFilter] = useState<'all' | 'popular' | 'recent'>('recent');

    // Función para cargar los mazos públicos
    const loadPublicDecks = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const publicDecks = await getAllPublicDecks();
            setDecks(publicDecks);
        } catch (err) {
            console.error('Error al cargar los mazos públicos:', err);
            setError('No se pudieron cargar los mazos. Por favor, intenta de nuevo más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar mazos al montar el componente
    useEffect(() => {
        loadPublicDecks();
    }, []);

    // Filtrar y ordenar mazos según filtro seleccionado
    const getFilteredDecks = () => {
        let filteredDecks = [...decks];
        
        // Aplicar filtro de búsqueda si existe
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredDecks = filteredDecks.filter(
                deck => deck.name.toLowerCase().includes(searchLower) || 
                       deck.userName.toLowerCase().includes(searchLower)
            );
        }
        
        // Aplicar ordenamiento según filtro
        switch (filter) {
            case 'popular':
                // Ordenar por número de likes (si no existe, asumir 0)
                return filteredDecks.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            case 'recent':
                // Ordenar por fecha de creación (más reciente primero)
                return filteredDecks.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
            default:
                return filteredDecks;
        }
    };

    // Manejar clic en filtro
    const handleFilterChange = (newFilter: 'all' | 'popular' | 'recent') => {
        setFilter(newFilter);
    };

    // Formatear fecha relativa
    const formatRelativeTime = (timestamp: string | Date | { toDate: () => Date } | undefined) => {
        if (!timestamp) return 'Fecha desconocida';
        
        const date = typeof timestamp === 'object' && 'toDate' in timestamp 
            ? timestamp.toDate() 
            : typeof timestamp === 'string' 
                ? new Date(timestamp) 
                : timestamp;
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `hace ${diffMins} min`;
        if (diffHours < 24) return `hace ${diffHours} h`;
        if (diffDays < 30) return `hace ${diffDays} d`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Manejar refresco del feed
    const handleRefresh = () => {
        loadPublicDecks();
    };

    const filteredDecks = getFilteredDecks();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Barra superior */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/decks">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">Explorar Mazos</h1>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="sticky top-[73px] z-10 bg-card border-b border-border p-4 space-y-4">
                <Input
                    placeholder="Buscar mazos por nombre o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
                
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button 
                            variant={filter === 'recent' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => handleFilterChange('recent')}
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            Recientes
                        </Button>
                        <Button 
                            variant={filter === 'popular' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => handleFilterChange('popular')}
                        >
                            <Heart className="h-4 w-4 mr-2" />
                            Populares
                        </Button>
                        <Button 
                            variant={filter === 'all' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => handleFilterChange('all')}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Todos
                        </Button>
                    </div>
                </div>
            </div>

            {/* Contenido principal - Feed de mazos */}
            <div className="flex-1 p-4 max-w-3xl mx-auto w-full">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : error ? (
                    <EmptyState
                        icon={<RefreshCw className="h-10 w-10 text-primary/60" />}
                        title="Error al cargar los mazos"
                        description={error}
                        action={
                            <Button onClick={handleRefresh}>
                                Reintentar
                            </Button>
                        }
                    />
                ) : filteredDecks.length === 0 ? (
                    <EmptyState
                        icon={<LayoutGrid className="h-10 w-10 text-primary/60" />}
                        title="No se encontraron mazos"
                        description={searchTerm ? "Intenta con otros términos de búsqueda" : "Aún no hay mazos públicos disponibles"}
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredDecks.map((deck) => (
                            <Card key={deck.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar del usuario */}
                                        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                            {deck.userAvatar ? (
                                                <img 
                                                    src={deck.userAvatar} 
                                                    alt={deck.userName} 
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-primary-foreground">
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Contenido del mazo */}
                                        <div className="flex-1 space-y-2">
                                            {/* Información del usuario y tiempo */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{deck.userName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatRelativeTime(deck.createdAt)}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{deck.cardIds?.length || 0} cartas</Badge>
                                            </div>
                                            
                                            {/* Nombre del mazo */}
                                            <h3 className="text-lg font-bold">{deck.name}</h3>
                                            
                                            {/* Vista previa de cartas (si estuviera disponible) */}
                                            <div className="flex space-x-1 my-2 overflow-hidden">
                                                {/* Aquí se podría mostrar una vista previa de algunas cartas */}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                
                                <CardFooter className="flex justify-between p-2 border-t">
                                    {/* Botones de interacción */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Heart className="h-4 w-4 mr-2" />
                                        <span>{deck.likes || 0}</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => navigate(`/decks/${deck.id}`)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        <span>Ver</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        <span>Compartir</span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DecksFeed; 