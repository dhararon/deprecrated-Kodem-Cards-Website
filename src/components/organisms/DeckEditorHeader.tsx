import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Spinner } from '@/components/atoms/Spinner';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { DeckStatus } from '@/types/deck';

type Props = {
  navigate: (path: string) => void;
  deckName: string;
  setDeckName: (v: string) => void;
  nameError: string;
  setNameError: (v: string) => void;
  deckStatus: DeckStatus;
  setDeckStatus: (v: DeckStatus) => void;
  isSaving: boolean;
  isNew: boolean;
  handleSaveDeck: () => Promise<void> | void;
  handleShareDeck: () => Promise<void> | void;
  setConfirmDeleteDialogOpen: (v: boolean) => void;
};

export const DeckEditorHeader: React.FC<Props> = ({
  navigate,
  deckName,
  setDeckName,
  nameError,
  setNameError,
  deckStatus,
  setDeckStatus,
  isSaving,
  isNew,
  handleSaveDeck,
  handleShareDeck,
  setConfirmDeleteDialogOpen
}) => {
  const getStatusColor = (status: DeckStatus) => {
    switch (status) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'private':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: DeckStatus) => {
    switch (status) {
      case 'public':
        return 'Público';
      case 'private':
        return 'Privado';
      case 'draft':
        return 'Draft';
      default:
        return 'Privado';
    }
  };

  return (
    <div className="hidden md:flex border-b px-4 py-3 items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="md" 
          className="h-8 w-8" 
          onClick={() => navigate('/decks')}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="text-sm text-muted-foreground">Nuevo mazo</div>
        <Input
          value={deckName}
          onChange={(e) => {
            setDeckName(e.target.value);
            setNameError('');
          }}
          placeholder="Nombre del mazo"
          className={`w-60 ${nameError ? 'border-destructive' : ''}`}
        />
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative group">
          <Button 
            variant="outline" 
            size="sm"
            className={`flex items-center gap-1 ${getStatusColor(deckStatus)}`}
          >
            {getStatusLabel(deckStatus)}
            <ChevronDown size={16} />
          </Button>
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-950 border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <button
              onClick={() => setDeckStatus('public')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 first:rounded-t-md border-b border-border last:border-b-0"
            >
              <span className="font-medium text-green-700 dark:text-green-400">🌍 Público</span>
              <p className="text-xs text-muted-foreground">Visible para todos</p>
            </button>
            <button
              onClick={() => setDeckStatus('private')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-border last:border-b-0"
            >
              <span className="font-medium text-red-700 dark:text-red-400">🔒 Privado</span>
              <p className="text-xs text-muted-foreground">Solo para ti</p>
            </button>
            <button
              onClick={() => setDeckStatus('draft')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 last:rounded-b-md"
            >
              <span className="font-medium text-yellow-700 dark:text-yellow-400">📝 Draft</span>
              <p className="text-xs text-muted-foreground">Sin requisitos mínimos</p>
            </button>
          </div>
        </div>
        <Button 
          onClick={handleSaveDeck}
          disabled={isSaving}
          className="flex items-center gap-1"
        >
          {isSaving ? (
            <Spinner size="sm" className="mr-1" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v4"/></svg>
          )}
          Guardar
        </Button>
        {!isNew && (
          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={handleShareDeck}
          >
            Compartir
          </Button>
        )}
      </div>
    </div>
  );
};

export default DeckEditorHeader;
