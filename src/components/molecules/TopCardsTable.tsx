import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Image } from '@/components/atoms/Image';
import { TopCard } from '@/types/analytics';

interface TopCardsTableProps {
    title: string;
    cards: TopCard[];
    description?: string;
    className?: string;
    showImages?: boolean;
}

export function TopCardsTable({ 
    title, 
    cards, 
    description, 
    className = '',
    showImages = true 
}: TopCardsTableProps) {
    const getEnergyColor = (energy?: string) => {
        const energyColors: { [key: string]: string } = {
            'átlica': 'bg-blue-500',
            'cháaktica': 'bg-green-500',
            'demótica': 'bg-purple-500',
            'feral': 'bg-orange-500',
            'gélida': 'bg-cyan-500',
            'húumica': 'bg-gray-500',
            'lítica': 'bg-yellow-500',
            'pírica': 'bg-red-500',
        };
        return energyColors[energy || ''] || 'bg-gray-400';
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    {title}
                </CardTitle>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {cards.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay datos suficientes para mostrar
                        </div>
                    ) : (
                        cards.map((card, index) => (
                            <div key={card.cardId} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                                {/* Ranking number */}
                                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">
                                        {index + 1}
                                    </span>
                                </div>
                                
                                {/* Card image */}
                                {showImages && (
                                    <div className="flex-shrink-0">
                                        <Image
                                            src={card.imageUrl}
                                            alt={card.name}
                                            className="w-12 h-16 object-cover rounded border"
                                            fallback={
                                                <div className="w-12 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                                    <span className="text-xs text-gray-500">N/A</span>
                                                </div>
                                            }
                                        />
                                    </div>
                                )}
                                
                                {/* Card info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-sm truncate">
                                            {card.name}
                                        </h4>
                                        {card.energy && (
                                            <div className="flex items-center space-x-1">
                                                <div 
                                                    className={`w-2 h-2 rounded-full ${getEnergyColor(card.energy)}`}
                                                />
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {card.energy}
                                                </span>
                                            </div>
                                        )}
                                        {card.type && (
                                            <Badge variant="outline" className="text-xs">
                                                {card.type}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Usage stats */}
                                <div className="flex-shrink-0 text-right">
                                    <div className="text-sm font-bold">
                                        {card.count}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {card.percentage}%
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}