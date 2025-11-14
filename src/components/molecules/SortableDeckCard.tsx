import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CardDetails } from '@/types/card';
import { CardType } from '@/types/card';

type Props = {
  card: CardDetails;
  id: string;
  renderDeckCard: (card: CardDetails) => React.ReactElement;
};

export const SortableDeckCard: React.FC<Props> = ({ card, id, renderDeckCard }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { card } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
  width: card.cardType === CardType.BIO ? '300px' : '157px',
    height: '220px'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
  className={`cursor-grab active:cursor-grabbing touch-manipulation ${card.cardType === CardType.BIO ? 'w-[300px] h-[157px] mx-auto' : 'w-[157px] h-[220px]'}`}
      data-id={id}
      key={card.id}
    >
      {renderDeckCard(card)}
    </div>
  );
};

export default SortableDeckCard;
