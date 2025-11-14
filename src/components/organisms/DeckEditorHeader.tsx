import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Spinner } from '@/components/atoms/Spinner';
import { ArrowLeft } from 'lucide-react';

type Props = {
  navigate: (path: string) => void;
  deckName: string;
  setDeckName: (v: string) => void;
  nameError: string;
  setNameError: (v: string) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
  isSaving: boolean;
  handleSaveDeck: () => Promise<void> | void;
  setConfirmDeleteDialogOpen: (v: boolean) => void;
};

export const DeckEditorHeader: React.FC<Props> = ({
  navigate,
  deckName,
  setDeckName,
  nameError,
  setNameError,
  isPublic,
  setIsPublic,
  isSaving,
  handleSaveDeck,
  setConfirmDeleteDialogOpen
}) => {
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
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-1 ${isPublic ? '' : 'bg-red-50'}`}
          onClick={() => setIsPublic(!isPublic)}
        >
          {isPublic ? 'Público' : 'Privado'}
        </Button>
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
        <Button
          variant="outline"
          className="flex items-center gap-1"
          onClick={() => setConfirmDeleteDialogOpen(true)}
        >
          Compartir
        </Button>
      </div>
    </div>
  );
};

export default DeckEditorHeader;
