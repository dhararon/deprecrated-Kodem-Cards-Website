import React, { useMemo, useState } from 'react';
import { Card as CardInterface } from '@/types/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/atoms/Separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/atoms/Dialog';
import { cn } from '@/lib/utils';

// Interfaz interna para el estado del componente, incluyendo el ID de Firestore
interface CardState extends CardInterface {
    id: string;
}

interface CardTableMobileFirstProps {
    cards: CardState[];
    isLoading: boolean;
    onEditCard: (card: CardState) => void;
    onDeleteCard: (card: CardState) => void;
}

/**
 * CardTableMobileFirst - Vista de administración de cartas optimizada para mobile-first
 * Muestra cartas en un formato de lista expandible similar a CollectionGridMobileFirst
 */
export const CardTableMobileFirst: React.FC<CardTableMobileFirstProps> = ({
    cards,
    isLoading,
    onEditCard,
    onDeleteCard
}) => {
    const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});
    const [deleteConfirmCard, setDeleteConfirmCard] = useState<CardState | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Calcula estadísticas de cartas agrupadas por set
    const cardStats = useMemo(() => {
        if (!cards || cards.length === 0) return null;

        // Agrupar por set
        const setGroups: Record<string, CardState[]> = {};
        cards.forEach(card => {
            const setName = card.cardSet || 'Sin set';
            if (!setGroups[setName]) {
                setGroups[setName] = [];
            }
            setGroups[setName].push(card);
        });

        // Contar cartas por tipo
        const typeGroups: Record<string, number> = {};
        cards.forEach(card => {
            const type = card.type || 'Sin tipo';
            typeGroups[type] = (typeGroups[type] || 0) + 1;
        });

        return {
            total: cards.length,
            bySet: setGroups,
            byType: typeGroups
        };
    }, [cards]);

    const toggleSet = (setName: string) => {
        setExpandedSets(prev => ({
            ...prev,
            [setName]: !prev[setName]
        }));
    };

    const handleDeleteClick = (card: CardState) => {
        setDeleteConfirmCard(card);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteConfirmCard) {
            onDeleteCard(deleteConfirmCard);
            setDeleteConfirmOpen(false);
            setDeleteConfirmCard(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="p-6 text-center rounded-lg border border-border bg-card">
                <h3 className="text-lg font-medium mb-2">No se encontraron cartas</h3>
                <p className="text-sm text-muted-foreground">Ajusta los filtros o busca por nombre</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Estadísticas principales */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="bg-card p-4 rounded-lg border">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{cardStats?.total || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total cartas</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{Object.keys(cardStats?.bySet || {}).length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Sets</div>
                </div>
                <div className="bg-card p-4 rounded-lg border sm:col-span-1 col-span-2 sm:col-span-1">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{Object.keys(cardStats?.byType || {}).length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Tipos</div>
                </div>
            </div>

            {/* Detalles de tipos */}
            {cardStats && Object.entries(cardStats.byType).length > 0 && (
                <div className="bg-card p-4 rounded-lg border">
                    <h3 className="text-sm font-medium mb-3">Distribución por tipo</h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(cardStats.byType).map(([type, count]) => (
                            <Badge key={type} variant="outline" className="text-xs capitalize">
                                {type}: {count}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Secciones por set */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold px-2">Cartas por Set</h2>
                {cardStats && Object.entries(cardStats.bySet).map(([setName, setCards]) => (
                    <div key={setName} className="border rounded-lg overflow-hidden bg-white">
                        {/* Header colapsable */}
                        <button
                            onClick={() => toggleSet(setName)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1 text-left">
                                <h3 className="font-medium text-sm sm:text-base">{setName}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="text-xs">{setCards.length} cartas</Badge>
                                {expandedSets[setName] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>

                        {/* Contenido colapsable */}
                        {expandedSets[setName] && (
                            <>
                                <Separator />
                                <div className="p-3 sm:p-4 space-y-3 max-h-96 overflow-y-auto">
                                    {setCards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            {/* Imagen pequeña */}
                                            <div className="flex-shrink-0 w-12 h-16 rounded border overflow-hidden bg-muted">
                                                {card.imageUrl ? (
                                                    <img
                                                        src={card.imageUrl}
                                                        alt={card.name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                        No img
                                                    </div>
                                                )}
                                            </div>

                                            {/* Información de la carta */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium truncate" title={card.name}>
                                                    {card.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className="text-xs">
                                                        {card.type || 'N/A'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {card.cardEnergy || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="flex-shrink-0 flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onEditCard(card)}
                                                    className="h-8 w-8 p-0"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(card)}
                                                    className="h-8 w-8 p-0"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Diálogo de confirmación de eliminación */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar carta</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar "{deleteConfirmCard?.name}"? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirmDelete}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CardTableMobileFirst;
