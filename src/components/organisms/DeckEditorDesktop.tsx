import React from 'react';
import type { CardDetails } from '@/types/card';
import DeckEditorCatalog from './DeckEditorCatalog';

type Props = {
  renderDeckOrganizer: () => React.ReactElement;
  filteredCards: CardDetails[];
  isLoadingCards: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedEnergy: string;
  setSelectedEnergy: (v: string) => void;
  selectedRarity: string;
  setSelectedRarity: (v: string) => void;
  selectedSet: string;
  setSelectedSet: (v: string) => void;
  typeOptions: string[];
  energyOptions: string[];
  rarityOptions: string[];
  setOptions: string[];
  renderCardForCatalog: (card: CardDetails) => React.ReactElement;
};

export const DeckEditorDesktop: React.FC<Props> = ({
  renderDeckOrganizer,
  filteredCards,
  isLoadingCards,
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedEnergy,
  setSelectedEnergy,
  selectedRarity,
  setSelectedRarity,
  selectedSet,
  setSelectedSet,
  typeOptions,
  energyOptions,
  rarityOptions,
  setOptions,
  renderCardForCatalog,
}) => {
  return (
    <div className="hidden md:flex flex-1 overflow-hidden">
      {/* Columna 1: Organizador de mazos (60%) */}
      <div className="w-[60%] overflow-y-auto border-r">
        <div className="p-4">
          {renderDeckOrganizer()}
        </div>
      </div>

      {/* Columna 2: Catálogo de cartas (40%) */}
      <DeckEditorCatalog
        filteredCards={filteredCards}
        isLoadingCards={isLoadingCards}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedEnergy={selectedEnergy}
        setSelectedEnergy={setSelectedEnergy}
        selectedRarity={selectedRarity}
        setSelectedRarity={setSelectedRarity}
        selectedSet={selectedSet}
        setSelectedSet={setSelectedSet}
        typeOptions={typeOptions}
        energyOptions={energyOptions}
        rarityOptions={rarityOptions}
        setOptions={setOptions}
        renderCardForCatalog={renderCardForCatalog}
      />
    </div>
  );
};

export default DeckEditorDesktop;
