import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardDetails } from '@/types/card';
import { CardType } from '@/types/card';
import { useResponsiveCardSize } from '@/hooks/useResponsiveCardSize';

type Props = {
  card: CardDetails;
  id: string;
  renderDeckCard: (card: CardDetails) => React.ReactElement;
};

export const SortableDeckCard: React.FC<Props> = ({ card, id, renderDeckCard }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { card } });
  const cardSize = useResponsiveCardSize();

  const isBio = card.cardType === CardType.BIO;
  const width = isBio ? cardSize.width * 1.91 : cardSize.width; // BIO es más ancho (300/157 ≈ 1.91)
  const height = isBio ? cardSize.height * 0.6 : cardSize.height; // BIO es más bajo (157/220 ≈ 0.6)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
    width: `${width}px`,
    height: `${height}px`
  };

  // Crear listeners personalizados que excluyen elementos con pointer-events-auto
  const filteredListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      // Si el click es en un elemento con pointer-events-auto (como el botón de basura), no iniciar DND
      if ((e.target as HTMLElement).closest('[style*="pointer-events-auto"]') || 
          (e.target as HTMLElement).closest('button')) {
        return;
      }
      listeners?.onPointerDown?.(e as any);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...filteredListeners}
      className={`cursor-grab active:cursor-grabbing touch-manipulation ${isBio ? 'mx-auto' : ''}`}
      data-id={id}
      key={card.id}
    >
      {renderDeckCard(card)}
    </div>
  );
};

export default SortableDeckCard;
