import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/lib/utils';

interface CollectionStatsProps {
    collected: number;
    total: number;
    className?: string;
}

/**
 * CollectionStats - Componente para mostrar estadísticas de colección
 */
export function CollectionStats({ collected, total, className }: CollectionStatsProps) {
    // Usar estado local para asegurar que los valores se actualicen correctamente
    const [stats, setStats] = useState({ collected: 0, total: 0 });

    // Actualizar el estado cuando cambian las props
    useEffect(() => {
        console.log('CollectionStats - Props recibidas:', { collected, total });
        setStats({ collected, total });
    }, [collected, total]);

    const percentage = stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0;

    return (
        <Badge
            variant="secondary"
            className={cn(
                "text-xs font-medium py-0.5 px-1.5 sm:px-2",
                className
            )}
            title={`${percentage}% completado`}
        >
            {stats.collected}/{stats.total}
        </Badge>
    );
}

export default CollectionStats; 