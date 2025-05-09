import React from 'react';
import { CardWithQuantity } from '@/types/collection';
import { Image } from '@/components/atoms/Image';
import { cn } from '@/lib/utils';

interface CardCarouselProps {
    cardGroup: CardWithQuantity;
    className?: string;
    onClick?: () => void;
}

const CardCarousel: React.FC<CardCarouselProps> = ({
    cardGroup,
    className = "",
    onClick
}) => {
    if (!cardGroup.mainCard) return null;

    const card = cardGroup.mainCard;

    return (
        <div
            className={cn("card-carousel relative", className)}
            onClick={onClick}
        >
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer mx-auto">
                {card.imageUrl ? (
                    <Image
                        src={card.imageUrl}
                        alt={card.name || 'Carta'}
                        width={300}
                        height={450}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 text-center p-3">
                            {card.name || 'Sin imagen'}
                        </span>
                    </div>
                )}
                
                {/* Overlay con el nombre */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white opacity-0 hover:opacity-100 transition-opacity">
                    <h3 className="text-sm font-medium truncate">{card.name}</h3>
                </div>
            </div>
            {card.quantity > 0 && (
                <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full px-2.5 py-1 text-sm font-bold min-w-[1.75rem] flex items-center justify-center shadow-md">
                    {card.quantity}
                </div>
            )}
        </div>
    );
};

export default CardCarousel; 