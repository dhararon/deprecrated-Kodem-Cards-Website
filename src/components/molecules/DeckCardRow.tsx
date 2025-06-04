import React from 'react';
import { CardDetails } from '@/types/card';
import DeckCard from '@/components/atoms/DeckCard';

interface DeckCardRowProps {
  cards: (CardDetails | null)[];
  columns: number;
  onCardClick?: (card: CardDetails) => void;
  selectedCardId?: string;
}

const DeckCardRow: React.FC<DeckCardRowProps> = React.memo(({ cards, columns, onCardClick, selectedCardId }) => (
  <div className={`grid grid-cols-${columns} gap-3`}>
    {cards.map((card, idx) =>
      card ? (
        <DeckCard
          key={card.id}
          card={card}
          selected={selectedCardId === card.id}
          onClick={onCardClick}
        />
      ) : (
        <div key={`empty-${idx}`} className="border-2 border-dashed rounded-md p-2 h-[220px] w-full bg-white" />
      )
    )}
  </div>
));
DeckCardRow.displayName = 'DeckCardRow';

export default DeckCardRow;
