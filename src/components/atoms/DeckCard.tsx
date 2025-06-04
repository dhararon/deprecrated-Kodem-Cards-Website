import React from 'react';
import { CardDetails } from '@/types/card';

interface DeckCardProps {
  card: CardDetails;
  selected?: boolean;
  onClick?: (card: CardDetails) => void;
  showId?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = React.memo(({ card, selected, onClick, showId }) => (
  <div
    className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors bg-white ${selected ? 'ring-2 ring-primary' : ''}`}
    onClick={() => onClick && onClick(card)}
    tabIndex={0}
    role="button"
    aria-pressed={selected}
  >
    {showId && (
      <span className="absolute top-1 left-1 text-xs text-muted-foreground bg-white/80 px-1 rounded">{card.fullId || 'ID-???'}</span>
    )}
    <img
      src={card.imageUrl}
      alt={card.name}
      className="w-full h-full object-contain"
      style={{ maxHeight: 200 }}
      draggable={false}
      loading="lazy"
    />
  </div>
));
DeckCard.displayName = 'DeckCard';

export default DeckCard;
