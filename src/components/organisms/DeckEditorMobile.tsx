import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
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

export const DeckEditorMobile: React.FC<Props> = ({
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
  const [activeTab, setActiveTab] = useState<'organizer' | 'catalog'>('organizer');

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab Navigation */}
      <div className="grid w-full grid-cols-2 border-b gap-0">
        <Button
          variant={activeTab === 'organizer' ? 'primary' : 'outline'}
          className="rounded-none"
          onClick={() => setActiveTab('organizer')}
        >
          Mi Mazo
        </Button>
        <Button
          variant={activeTab === 'catalog' ? 'primary' : 'outline'}
          className="rounded-none"
          onClick={() => setActiveTab('catalog')}
        >
          Catálogo
        </Button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Tab 1: Deck Organizer */}
        {activeTab === 'organizer' && (
          <div className="h-full overflow-y-auto p-3">
            <div className="space-y-4">
              {renderDeckOrganizer()}
            </div>
          </div>
        )}

        {/* Tab 2: Card Catalog */}
        {activeTab === 'catalog' && (
          <div className="h-full overflow-y-auto p-0">
            <DeckEditorCatalog
              isMobile={true}
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
        )}
      </div>
    </div>
  );
};

export default DeckEditorMobile;
