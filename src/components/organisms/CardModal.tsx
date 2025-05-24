import React from 'react';
import { Button } from '@/components/atoms/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/atoms/Dialog";

// Interface para los datos de la carta
export interface CardDetails {
    id: string;
    name: string;
    set?: string;
    cardNumber?: string;
    fullId?: string;
    imageUrl?: string;
    cardType?: string;
    cardEnergy?: string;
    element?: string;
    power?: number;
    sleep?: number;
    rarity?: string;
    description?: string;
    rules?: string[];
    is_promo?: boolean;
    artists?: string[];
    legalities?: Record<string, string>;
}

export interface CardModalProps {
    /**
     * Carta a mostrar en el modal
     */
    card: CardDetails | null;

    /**
     * Estado del diálogo (abierto/cerrado)
     */
    open: boolean;

    /**
     * Función para cambiar el estado del diálogo
     */
    onOpenChange: (open: boolean) => void;

    /**
     * Callback cuando se hace clic en el botón de acción principal
     */
    onAction?: (card: CardDetails) => void;

    /**
     * Texto del botón de acción principal
     */
    actionLabel?: string;

    /**
     * Si el botón de acción está deshabilitado
     */
    actionDisabled?: boolean;

    /**
     * Texto a mostrar cuando el botón está deshabilitado
     */
    disabledActionLabel?: string;

    /**
     * Determinará si se muestra el botón de acción
     */
    showAction?: boolean;
}

// Ejemplo de validación segura de host
function isTrustedHost(url: string, trustedHosts: string[]): boolean {
    try {
        const parsed = new URL(url);
        return trustedHosts.includes(parsed.host);
    } catch (e) {
        return false;
    }
}

/**
 * CardModal - Componente para mostrar detalles de una carta en un modal
 */
export function CardModal({
    card,
    open,
    onOpenChange,
    onAction,
    actionLabel = "Añadir al mazo",
    actionDisabled = false,
    disabledActionLabel = "Ya en el mazo",
    showAction = true
}: CardModalProps) {
    // Generar un placeholder de imagen basado en el nombre de la carta
    const getCardPlaceholder = (card: CardDetails) => {
        const colorMap: Record<string, string> = {
            Agua: '#0096c7',
            Fuego: '#e5383b',
            Tierra: '#a68a64',
            Naturaleza: '#588157',
            Espíritu: '#9d4edd',
            Oscuridad: '#3a0ca3',
            Luz: '#ffba08',
            Neutral: '#4d4d4d'
        };

        // Usar el elemento de la carta para el color, o un color predeterminado
        const bgColor = (card.element && colorMap[card.element]) ? colorMap[card.element] : '#4361ee';

        return `https://placehold.co/300x400/${bgColor.replace('#', '')}/FFFFFF?text=${encodeURIComponent(card.name)}`;
    };

    // Manejar la acción principal (p.ej. añadir al mazo)
    const handleAction = () => {
        if (card && onAction && !actionDisabled) {
            onAction(card);
        }
    };

    if (!card) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>{card.name}</DialogTitle>
                    <DialogDescription>
                        {card.set} • {card.fullId || card.cardNumber || 'N/A'}
                        {card.is_promo && <span className="ml-2 text-purple-600">• Promocional</span>}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 my-4">
                    <div
                        className="aspect-[2/3] w-full max-w-[200px] mx-auto bg-gray-100 rounded-md overflow-hidden"
                        style={{
                            backgroundImage: `url(${card.imageUrl && !isTrustedHost(card.imageUrl, ["kodem-tcg.com"])
                                ? card.imageUrl
                                : getCardPlaceholder(card)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {!card.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No disponible
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {card.cardType && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Tipo:</span>
                                <span className="ml-2 capitalize">{card.cardType}</span>
                            </div>
                        )}
                        {card.cardEnergy && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Energía:</span>
                                <span className="ml-2 capitalize">{card.cardEnergy}</span>
                            </div>
                        )}
                        {card.power !== undefined && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Poder:</span>
                                <span className="ml-2">{card.power}</span>
                            </div>
                        )}
                        {card.sleep !== undefined && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Descanso:</span>
                                <span className="ml-2">{card.sleep}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-sm font-medium text-gray-500">Set:</span>
                            <span className="ml-2">{card.set || 'Desconocido'}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">Rareza:</span>
                            <span className="ml-2">{card.rarity}</span>
                        </div>
                        {card.element && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Elemento:</span>
                                <span className="ml-2">{card.element}</span>
                            </div>
                        )}
                        {card.artists && card.artists.length > 0 && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Artista:</span>
                                <span className="ml-2">{card.artists.join(', ')}</span>
                            </div>
                        )}
                        {card.legalities && Object.keys(card.legalities).length > 0 && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Legalidad:</span>
                                {Object.entries(card.legalities).map(([format, legality]) => (
                                    <span key={format} className={`ml-2 text-xs px-1.5 py-0.5 rounded ${legality === 'legal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {format}: {legality}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {card.description && (
                        <div className="mt-2 border-t pt-3">
                            <p className="text-sm italic">{card.description}</p>
                        </div>
                    )}

                    {card.rules && card.rules.length > 0 && (
                        <div className="mt-2 border-t pt-3">
                            <h4 className="text-sm font-medium mb-1">Reglas:</h4>
                            <ul className="list-disc ml-5 text-sm space-y-1">
                                {card.rules.map((rule, index) => (
                                    <li key={index}>{rule}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {showAction && (
                        actionDisabled ? (
                            <Button
                                variant="secondary"
                                className="w-full sm:w-auto"
                                disabled
                            >
                                {disabledActionLabel}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                className="w-full sm:w-auto"
                                onClick={handleAction}
                            >
                                {actionLabel}
                            </Button>
                        )
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 