import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { PlusIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { CardTable } from '@/components/organisms/CardTable';
import { CardFilters } from '@/components/organisms/CardFilters';
import { CardFormModal } from '@/components/organisms/CardFormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Card as CardInterface, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/atoms/Dialog';

// Interfaz interna para el estado del componente, incluyendo el ID de Firestore
interface CardState extends CardInterface {
    id: string;
}

interface CardsTemplateProps {
  cards: CardState[];
  isLoading: boolean;
  searchTerm: string;
  showFilters: boolean;
  showCardModal: boolean;
  showDeleteModal: boolean;
  currentCard: CardState | null;
  editMode: boolean;
  isDeleting: boolean;
  
  // Filtros
  typeFilter: CardType | 'all_types';
  energyFilter: CardEnergy | 'all_energies';
  rarityFilter: CardRarity | 'all_rarities';
  artistFilter: string;
  setFilter: CardSet | 'all_sets';
  standardLegalFilter: boolean;
  uniqueArtists: string[];
  hasActiveFilters: boolean;
  
  // Handlers
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleFilters: () => void;
  onNewCard: () => void;
  onEditCard: (card: CardState) => void;
  onDeletePrompt: (card: CardState) => void;
  onCardModalChange: (open: boolean) => void;
  onCardSaved: (card: CardState) => void;
  onDeleteCard: () => void;
  onCancelDelete: () => void;
  onTypeFilterChange: (value: string) => void;
  onEnergyFilterChange: (value: string) => void;
  onRarityFilterChange: (value: string) => void;
  onArtistFilterChange: (value: string) => void;
  onSetFilterChange: (value: string) => void;
  onStandardLegalFilterChange: (value: boolean) => void;
  onClearFilters: () => void;
}

export const CardsTemplate: React.FC<CardsTemplateProps> = ({
  cards,
  isLoading,
  searchTerm,
  showFilters,
  showCardModal,
  showDeleteModal,
  currentCard,
  editMode,
  isDeleting,
  
  // Filtros
  typeFilter,
  energyFilter,
  rarityFilter,
  artistFilter,
  setFilter,
  standardLegalFilter,
  uniqueArtists,
  hasActiveFilters,
  
  // Handlers
  onSearchChange,
  onToggleFilters,
  onNewCard,
  onEditCard,
  onDeletePrompt,
  onCardModalChange,
  onCardSaved,
  onDeleteCard,
  onCancelDelete,
  onTypeFilterChange,
  onEnergyFilterChange,
  onRarityFilterChange,
  onArtistFilterChange,
  onSetFilterChange,
  onStandardLegalFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Administrar Cartas</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={onNewCard}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nueva Carta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-grow">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tarjetas..."
                value={searchTerm}
                onChange={onSearchChange}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={onToggleFilters}>
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
          
          {showFilters && (
            <CardFilters 
              typeFilter={typeFilter}
              energyFilter={energyFilter}
              rarityFilter={rarityFilter}
              artistFilter={artistFilter}
              setFilter={setFilter}
              standardLegalFilter={standardLegalFilter}
              onTypeFilterChange={onTypeFilterChange}
              onEnergyFilterChange={onEnergyFilterChange}
              onRarityFilterChange={onRarityFilterChange}
              onArtistFilterChange={onArtistFilterChange}
              onSetFilterChange={onSetFilterChange}
              onStandardLegalFilterChange={onStandardLegalFilterChange}
              onClearFilters={onClearFilters}
              uniqueArtists={uniqueArtists}
              hasActiveFilters={hasActiveFilters}
            />
          )}
          
          <CardTable
            cards={cards}
            isLoading={isLoading}
            onEditCard={onEditCard}
            onDeleteCard={onDeletePrompt}
          />
        </CardContent>
      </Card>
      
      <CardFormModal
        open={showCardModal}
        onOpenChange={onCardModalChange}
        currentCard={currentCard}
        editMode={editMode}
        onCardSaved={onCardSaved}
      />
      
      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={onCancelDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la carta {currentCard?.name}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCancelDelete}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={onDeleteCard} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 