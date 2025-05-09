import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Label } from '@/components/atoms/Label';
import { FilterItem } from '@/components/molecules/FilterItem';
import { CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';

interface CardFiltersProps {
    typeFilter: CardType | 'all_types';
    energyFilter: CardEnergy | 'all_energies';
    rarityFilter: CardRarity | 'all_rarities';
    artistFilter: string;
    setFilter: CardSet | 'all_sets';
    standardLegalFilter: boolean;
    onTypeFilterChange: (value: string) => void;
    onEnergyFilterChange: (value: string) => void;
    onRarityFilterChange: (value: string) => void;
    onArtistFilterChange: (value: string) => void;
    onSetFilterChange: (value: string) => void;
    onStandardLegalFilterChange: (value: boolean) => void;
    onClearFilters: () => void;
    uniqueArtists: string[];
    hasActiveFilters: boolean;
}

export const CardFilters: React.FC<CardFiltersProps> = ({
    typeFilter,
    energyFilter,
    rarityFilter,
    artistFilter,
    setFilter,
    standardLegalFilter,
    onTypeFilterChange,
    onEnergyFilterChange,
    onRarityFilterChange,
    onArtistFilterChange,
    onSetFilterChange,
    onStandardLegalFilterChange,
    onClearFilters,
    uniqueArtists,
    hasActiveFilters,
}) => {
    return (
        <div className="mb-6 p-4 border rounded-lg bg-background">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Filtros</h3>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters}>
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Limpiar filtros
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <FilterItem
                    label="Tipo"
                    value={typeFilter}
                    onChange={onTypeFilterChange}
                    options={[
                        { value: 'all_types', label: 'Todos los tipos' },
                        ...Object.values(CardType).map(type => ({
                            value: type,
                            label: type
                        }))
                    ]}
                />
                <FilterItem
                    label="Energía"
                    value={energyFilter}
                    onChange={onEnergyFilterChange}
                    options={[
                        { value: 'all_energies', label: 'Todas las energías' },
                        ...Object.values(CardEnergy).map(energy => ({
                            value: energy,
                            label: energy
                        }))
                    ]}
                />
                <FilterItem
                    label="Rareza"
                    value={rarityFilter}
                    onChange={onRarityFilterChange}
                    options={[
                        { value: 'all_rarities', label: 'Todas las rarezas' },
                        ...Object.values(CardRarity).map(rarity => ({
                            value: rarity,
                            label: rarity
                        }))
                    ]}
                />
                <FilterItem
                    label="Artista"
                    value={artistFilter}
                    onChange={onArtistFilterChange}
                    options={[
                        { value: 'all_artists', label: 'Todos los artistas' },
                        ...uniqueArtists.map(artist => ({
                            value: artist,
                            label: artist
                        }))
                    ]}
                />
                <FilterItem
                    label="Set"
                    value={setFilter}
                    onChange={onSetFilterChange}
                    options={[
                        { value: 'all_sets', label: 'Todos los sets' },
                        ...Object.values(CardSet).map(set => ({
                            value: set,
                            label: set
                        }))
                    ]}
                />
            </div>
            <div className="mt-4 flex items-center space-x-2">
                <Checkbox 
                    id="standardLegal" 
                    checked={standardLegalFilter} 
                    onCheckedChange={(checked) => onStandardLegalFilterChange(checked === true)}
                />
                <Label htmlFor="standardLegal" className="text-sm cursor-pointer">
                    Solo mostrar cartas estándar legal
                </Label>
            </div>
        </div>
    );
}; 