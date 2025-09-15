import React from 'react';
import { Button } from '@/components/atoms/Button';
import { cn } from '@/lib/utils';

interface QuantityControlProps {
    id: string;
    quantity: number;
    onUpdate: (quantity: number) => void;
    isUpdating: boolean;
    compact?: boolean;
    className?: string;
}

/**
 * QuantityControl - Componente para controlar la cantidad de cartas
 */
const QuantityControl: React.FC<QuantityControlProps> = ({
    id,
    quantity,
    onUpdate,
    isUpdating,
    compact = false,
    className
}) => {
    if (compact) {
        return (
            <div className={cn('flex items-center', className)}>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating || quantity <= 0}
                    onClick={() => onUpdate(Math.max(0, quantity - 1))}
                    className="h-5 w-5 p-0 text-xs"
                >
                    -
                </Button>
                <span className={cn(
                    "inline-flex items-center justify-center h-5 min-w-[1.25rem] text-xs font-medium",
                    quantity > 0 ? "text-primary" : "text-muted-foreground"
                )}>
                    {quantity}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => onUpdate(quantity + 1)}
                    className="h-5 w-5 p-0 text-xs"
                >
                    +
                </Button>
            </div>
        );
    }

    return (
        <div className={cn('flex items-center', className)}>
            <Button
                variant="outline"
                size="sm"
                disabled={isUpdating || quantity <= 0}
                onClick={() => onUpdate(Math.max(0, quantity - 1))}
                className="h-6 w-6 rounded-r-none"
            >
                -
            </Button>
            <input
                type="number"
                id={`quantity-${id}`}
                min="0"
                value={quantity}
                onChange={(e) => {
                    const qty = parseInt(e.target.value);
                    if (!isNaN(qty) && qty >= 0) {
                        onUpdate(qty);
                    }
                }}
                className="h-6 w-12 px-1 text-center text-xs rounded-none border-x-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={isUpdating}
            />
            <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => onUpdate(quantity + 1)}
                className="h-6 w-6 rounded-l-none"
            >
                +
            </Button>
        </div>
    );
};

export default QuantityControl; 