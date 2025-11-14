import React from 'react';
import DeckCard from './DeckCard';
import { CardDetails } from '@/types/card';

type DeckSlotProps = {
  card?: CardDetails;
  isDragging?: boolean;
  onRemove?: (id: string) => void;
  children?: React.ReactNode;
};

const DeckSlot: React.FC<DeckSlotProps> = React.memo(({ card, isDragging, onRemove, children }) => (
  <div className="deck-slot relative w-full h-full flex items-center justify-center border rounded-md bg-white">
    {card ? (
      <DeckCard card={card} isDragging={isDragging} onRemove={onRemove} />
    ) : (
      children
    )}
  </div>
));
DeckSlot.displayName = 'DeckSlot';
export default DeckSlot;
