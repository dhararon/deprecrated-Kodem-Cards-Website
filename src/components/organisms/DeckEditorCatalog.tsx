import React from 'react';
import { Input } from '@/components/atoms/Input';
import { Spinner } from '@/components/atoms/Spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';
import { EmptyState } from '@/components/molecules/EmptyState';

import type { CardDetails, CardType, CardEnergy } from '@/types/card';

type Props = {
  filteredCards: CardDetails[];
  isLoadingCards: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedEnergy: string;
  setSelectedEnergy: (v: string) => void;
  typeOptions: string[];
  energyOptions: string[];
  renderCardForCatalog: (card: CardDetails) => React.ReactElement;
};

export const DeckEditorCatalog: React.FC<Props> = ({
  filteredCards,
  isLoadingCards,
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedEnergy,
  setSelectedEnergy,
  typeOptions,
  energyOptions,
  renderCardForCatalog
}) => {
  return (
    <div className="w-[40%] border-l overflow-y-auto">
      <div className="p-4">
        {/* Buscador */}
        <div className="flex mb-6">
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            placeholder="Buscar carta"
            className="w-full"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select
            value={selectedType}
            onValueChange={(value) => {
              setSelectedType(value);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">Tipo</SelectItem>
              {typeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedEnergy}
            onValueChange={(value) => {
              setSelectedEnergy(value);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Energía" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_energies">Energía</SelectItem>
              {energyOptions.map((energy) => (
                <SelectItem key={energy} value={energy}>
                  {energy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de cartas */}
        {isLoadingCards ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner size="md" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="border border-dashed rounded-lg p-6 text-center">
            <div className="flex justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 className="font-semibold">Busca cartas para tu mazo</h3>
            <p className="text-sm text-muted-foreground mt-1">Introduce un término de búsqueda para encontrar cartas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCards.map(card => renderCardForCatalog(card))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckEditorCatalog;
