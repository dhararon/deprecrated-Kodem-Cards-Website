import React from 'react';
import { CardDetails } from '@/types/card';
import DeleteCardButton from '@/components/atoms/DeleteCardButton';

type Props = {
  card: CardDetails;
  isDragging?: boolean;
  onRemove: (id: string) => void;
};

function CardPreview({ card }: { card: CardDetails }) {
  return (
    <div className="fixed z-[9999] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
         style={{
           top: '50%',
           left: '50%',
           transform: 'translate(-50%, -50%)',
           width: '300px',
           height: '420px'
         }}>
      <div className="bg-white rounded-lg shadow-2xl p-2">
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain rounded" loading="lazy" />
      </div>
    </div>
  );
}

function DeckCard({ card, isDragging, onRemove }: Props) {
  return (
    <div className="deck-card-container relative group">
      <div className="relative">
        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain" draggable={false} loading="lazy" />

        <CardPreview card={card} />

        <DeleteCardButton 
          cardName={card.name}
          onDelete={() => onRemove(card.id)}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
}

export default React.memo(DeckCard);
