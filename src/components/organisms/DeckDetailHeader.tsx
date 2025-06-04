import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { ChevronLeft, Eye } from 'lucide-react';

interface DeckDetailHeaderProps {
  deckName: string;
  cardCount: number;
  isPublic: boolean;
  onToggleView: () => void;
  viewMode: 'grid' | 'list';
  onCopy: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

const DeckDetailHeader: React.FC<DeckDetailHeaderProps> = ({
  deckName,
  cardCount,
  isPublic,
  onToggleView,
  viewMode,
  onCopy,
  onPrint,
  onDownload,
}) => (
  <div className="flex items-center justify-between p-4 border-b border-border bg-card">
    <div className="flex items-center">
      <Link href="/decks">
        <Button variant="ghost" size="sm" className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <h1 className="text-xl font-bold">{deckName}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{cardCount} cartas</span>
          {isPublic ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <Eye className="h-3 w-3 mr-1" />
              Público
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <Eye className="h-3 w-3 mr-1" />
              Privado
            </Badge>
          )}
        </div>
      </div>
    </div>
    <div className="hidden md:flex gap-2">
      <Button variant="outline" size="sm" onClick={onToggleView}>
        {viewMode === 'list' ? 'Ver grid' : 'Ver lista'}
      </Button>
      <Button variant="primary" size="sm" className="flex-1" onClick={onCopy}>
        Copiar lista
      </Button>
      <Button variant="outline" size="sm" onClick={onPrint}>
        Imprimir
      </Button>
      <Button variant="outline" size="sm" onClick={onDownload}>
        Descargar
      </Button>
    </div>
  </div>
);

export default DeckDetailHeader;
