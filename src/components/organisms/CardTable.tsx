import React, { useMemo } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableFooter } from '@/components/atoms/Table';
import { CardListItem } from '@/components/molecules/CardListItem';
import { Card as CardInterface } from '@/types/card';
import { Badge } from '@/components/atoms/Badge';

// Interfaz interna para el estado del componente, incluyendo el ID de Firestore
interface CardState extends CardInterface {
  id: string; // Asegurar que el ID de Firestore esté presente
}

interface CardTableProps {
  cards: CardState[];
  isLoading: boolean;
  onEditCard: (card: CardState) => void;
  onDeleteCard: (card: CardState) => void;
}

export const CardTable: React.FC<CardTableProps> = ({
  cards,
  isLoading,
  onEditCard,
  onDeleteCard
}) => {
  // Calcula estadísticas de cartas agrupadas por set
  const cardStats = useMemo(() => {
    if (!cards || cards.length === 0) return null;

    // Agrupar por set
    const setGroups: Record<string, CardState[]> = {};
    cards.forEach(card => {
      const setName = card.cardSet || 'Sin set';
      if (!setGroups[setName]) {
        setGroups[setName] = [];
      }
      setGroups[setName].push(card);
    });

    // Contar cartas por tipo
    const typeGroups: Record<string, number> = {};
    cards.forEach(card => {
      const type = card.type || 'Sin tipo';
      typeGroups[type] = (typeGroups[type] || 0) + 1;
    });

    return {
      total: cards.length,
      bySet: setGroups,
      byType: typeGroups
    };
  }, [cards]);

  if (isLoading) {
    return <div className="text-center py-4">Cargando tarjetas...</div>;
  }

  if (cards.length === 0) {
    return <div className="text-center py-4">No se encontraron tarjetas</div>;
  }

  return (
    <div className="space-y-3">
      {/* Contador de cartas */}
      <div className="bg-card p-3 rounded-lg border">
        <h3 className="text-sm font-medium mb-2">Resumen de cartas</h3>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs px-2 py-1">
            Total: {cardStats?.total || 0}
          </Badge>
          {cardStats && Object.entries(cardStats.byType).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {Object.entries(cardStats.byType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs capitalize">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Sets badges */}
        {cardStats && Object.entries(cardStats.bySet).length > 0 && (
          <div className="flex flex-wrap gap-1 text-xs">
            {Object.entries(cardStats.bySet).map(([setName, setCards]) => (
              <Badge key={setName} variant="outline" className="capitalize bg-primary/10">
                {setName}: {setCards.length}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Tabla de cartas */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Energía</TableHead>
            <TableHead>Rareza</TableHead>
            <TableHead>Set</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map(card => (
            <CardListItem
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead colSpan={7} className="text-right text-xs text-muted-foreground">
              Total: {cards.length} cartas
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}; 