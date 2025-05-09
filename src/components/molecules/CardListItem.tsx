import React from 'react';
import { TableRow, TableCell } from '@/components/atoms/Table';
import { Badge } from '@/components/atoms/Badge';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { Card as CardInterface } from '@/types/card';

// Interfaz interna para el estado del componente, incluyendo el ID de Firestore
interface CardState extends CardInterface {
  id: string; // Asegurar que el ID de Firestore esté presente
}

interface CardListItemProps {
  card: CardState;
  onEdit: (card: CardState) => void;
  onDelete: (card: CardState) => void;
}

export const CardListItem: React.FC<CardListItemProps> = ({ card, onEdit, onDelete }) => {
  return (
    <TableRow>
      <TableCell>{card.fullId || `#${card.cardNumber || 'N/A'}`}</TableCell>
      <TableCell>{card.name}</TableCell>
      <TableCell>{card.cardType}</TableCell>
      <TableCell>{card.cardEnergy}</TableCell>
      <TableCell>
        <Badge variant="outline">{card.rarity}</Badge>
      </TableCell>
      <TableCell>{card.cardSet}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onEdit(card)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(card)}>
          <TrashIcon className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}; 