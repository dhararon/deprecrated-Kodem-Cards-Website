import React from 'react';
import { Card, CardContent } from '@/components/atoms/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Eye } from 'lucide-react';
import { CardDetails } from '@/types/card';

interface DeckSelectedCardProps {
  card: CardDetails | null;
}

const DeckSelectedCard: React.FC<DeckSelectedCardProps> = ({ card }) => {
  if (!card) {
    return (
      <Card className="sticky top-4">
        <CardContent className="p-8">
          <EmptyState
            title="Selecciona una carta"
            description="Haz clic en una carta del mazo para ver sus detalles"
            icon={<Eye className="h-10 w-10 text-primary/60" />}
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="sticky top-4">
      <CardContent className="p-4 flex flex-col items-center">
        <div className="w-full max-w-[300px] rounded-lg overflow-hidden mb-4">
          <img src={card.imageUrl} alt={card.name} className="w-full h-auto" />
        </div>
        <h3 className="text-xl font-bold mb-1">{card.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {card.type} {card.energy && `• ${card.energy}`}
        </p>
        {card.description && (
          <div className="w-full mb-3">
            <h4 className="text-sm font-semibold mb-1">Descripción</h4>
            <p className="text-sm">{card.description}</p>
          </div>
        )}
        {card.rules && card.rules.length > 0 && (
          <div className="w-full">
            <h4 className="text-sm font-semibold mb-1">Reglas</h4>
            <div className="space-y-2">
              {card.rules.map((rule, idx) => (
                <p key={idx} className="text-sm">{rule}</p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeckSelectedCard;
