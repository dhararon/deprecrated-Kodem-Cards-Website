import React from 'react';
import { CardDetails } from '@/types/card';
import { Button } from '@/components/atoms/Button';
import { Trash2 } from 'lucide-react';
import { Image } from '@/components/atoms/Image';

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

        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center h-10 w-10"
            onClick={(e) => { e.stopPropagation(); onRemove(card.id); }}
            aria-label={`Eliminar ${card.name} del mazo`}
            style={{ outline: 'none', border: 'none' }}
          >
            <Trash2 size={20} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DeckCard);
