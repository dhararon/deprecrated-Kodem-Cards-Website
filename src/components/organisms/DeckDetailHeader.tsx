import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { ChevronLeft, Eye, Share2 } from 'lucide-react';
import { DeckStatus } from '@/types/deck';

interface DeckDetailHeaderProps {
  deckName: string;
  cardCount: number;
  deckStatus?: DeckStatus;
  isPublic?: boolean; // Deprecated: use deckStatus instead
  onToggleView: () => void;
  viewMode: 'grid' | 'list';
  onCopy: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onShare: () => void;
}

const DeckDetailHeader: React.FC<DeckDetailHeaderProps> = ({
  deckName,
  cardCount,
  deckStatus,
  isPublic,
  onToggleView,
  viewMode,
  onCopy,
  onPrint,
  onDownload,
  onShare,
}) => {
  const status = deckStatus || (isPublic ? 'public' : 'private');
  
  return (
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
          {(() => {
            switch (status) {
              case 'public':
                return (
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <Eye className="h-3 w-3 mr-1" />
                    Público
                  </Badge>
                );
              case 'private':
                return (
                  <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <Eye className="h-3 w-3 mr-1" />
                    Privado
                  </Badge>
                );
              case 'draft':
                return (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    📝 Draft
                  </Badge>
                );
              default:
                return null;
            }
          })()}
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
      <Button variant="outline" size="sm" onClick={onShare}>
        <Share2 className="h-4 w-4 mr-2" />
        Compartir
      </Button>
      <Button variant="outline" size="sm" onClick={onDownload}>
        Descargar
      </Button>
    </div>
  </div>
  );
};

export default DeckDetailHeader;
