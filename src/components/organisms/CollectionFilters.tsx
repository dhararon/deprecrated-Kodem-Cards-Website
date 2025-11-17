import React, { useEffect, useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/atoms/Button';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';
import { FilterItem } from '@/components/molecules/FilterItem';
import { CardType, CardEnergy, CardRarity } from '@/types/card';

export interface CollectionFiltersState {
    searchTerm: string;
    typeFilter: CardType | 'all_types';
    energyFilter: CardEnergy | 'all_energies';
    rarityFilter: CardRarity | 'all_rarities';
    showOnlyMissing: boolean;
    showOnlyCollected: boolean;
}

interface CollectionFiltersProps {
    filters: CollectionFiltersState;
    onFiltersChange: (filters: Partial<CollectionFiltersState>) => void;
    onClearFilters: () => void;
}

export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
}) => {
    const { searchTerm, typeFilter, energyFilter, rarityFilter, showOnlyMissing, showOnlyCollected } = filters;
    
    // Estados para controlar la disponibilidad de datos
    const [haveTypeData, setHaveTypeData] = useState<boolean>(true);
    const [haveEnergyData, setHaveEnergyData] = useState<boolean>(true);

    // Depuración - Inspeccionar los valores de CardType y CardEnergy para verificar que son correctos
    useEffect(() => {
        console.log('Valores disponibles de CardType:', Object.values(CardType));
        console.log('Valores disponibles de CardEnergy:', Object.values(CardEnergy));
        console.log('Valores disponibles de CardRarity:', Object.values(CardRarity));
        
        // Intentar determinar la disponibilidad de datos basados en la depuración de la consola
        // Esto debería sincronizarse automáticamente con el estado en useCollectionFilters
        const storedTypeAvailability = localStorage.getItem('haveTypeData');
        const storedEnergyAvailability = localStorage.getItem('haveEnergyData');
        
        if (storedTypeAvailability !== null) {
            setHaveTypeData(storedTypeAvailability === 'true');
        }
        
        if (storedEnergyAvailability !== null) {
            setHaveEnergyData(storedEnergyAvailability === 'true');
        }
    }, []);

    // Comprobar si hay algún filtro activo
    const hasActiveFilters =
        searchTerm !== '' ||
        typeFilter !== 'all_types' ||
        energyFilter !== 'all_energies' ||
        rarityFilter !== 'all_rarities' ||
        showOnlyMissing ||
        showOnlyCollected;

    // Manejadores de cambio para cada filtro
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ searchTerm: e.target.value });
    };

    const handleTypeFilterChange = (value: string) => {
        console.log('Cambiando tipo de carta a:', value);
        
        // Caso especial para ROT - asegurarse de que sea exactamente "rot"
        if (value.toLowerCase() === 'rot') {
            console.log('¡ROT seleccionado! - Aplicando tratamiento especial');
            // Asegurarse de que el valor sea exactamente "rot" del enum CardType
            const rotEnumValue = Object.values(CardType).find(
                type => type.toLowerCase() === 'rot'
            );
            
            if (rotEnumValue) {
                console.log('Valor ROT del enum encontrado:', rotEnumValue);
                onFiltersChange({ typeFilter: rotEnumValue as CardType });
                return;
            }
        }
        
        // Asegurarse de que el valor sea convertido correctamente al tipo esperado
        const newTypeFilter = value as CardType | 'all_types';
        onFiltersChange({ typeFilter: newTypeFilter });
    };

    const handleEnergyFilterChange = (value: string) => {
        onFiltersChange({ energyFilter: value as CardEnergy | 'all_energies' });
    };

    const handleRarityFilterChange = (value: string) => {
        onFiltersChange({ rarityFilter: value as CardRarity | 'all_rarities' });
    };

    const handleShowOnlyMissingChange = (checked: boolean) => {
        onFiltersChange({ showOnlyMissing: checked });
    };
    
    const handleShowOnlyCollectedChange = (checked: boolean) => {
        onFiltersChange({ showOnlyCollected: checked });
    };

    return (
        <div className="py-2 px-3 sm:p-4 bg-background">
            {/* Barra de búsqueda - ahora más accesible */}
            <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Buscar por nombre o ID..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-8 w-full h-10 sm:h-9 text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1 ml-1">
                    Busca por nombre de carta o por ID (ej. IDRMP-001)
                </div>
            </div>

            {/* Botón limpiar filtros - visible solo cuando hay filtros activos */}
            {hasActiveFilters && (
                <div className="mb-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="w-full justify-center h-9 text-xs flex items-center gap-1"
                    >
                        <XMarkIcon className="h-4 w-4" />
                        Limpiar filtros
                    </Button>
                </div>
            )}

            {/* Mensaje de advertencia si faltan datos de tipo o energía */}
            {(!haveTypeData || !haveEnergyData) && (
                <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded-md flex items-start gap-2 text-yellow-800">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <p className="font-medium">Advertencia: Datos inconsistentes</p>
                        <p>Se han detectado inconsistencias en los datos de las cartas. Algunos filtros podrían no funcionar correctamente.</p>
                    </div>
                </div>
            )}

            {/* Filtros de checkbox - ahora arriba antes de los filtros de tipo/energía/rareza */}
            <div className="space-y-2 mb-3">
                {/* Checkbox para cartas faltantes */}
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                    <Checkbox
                        id="showOnlyMissing"
                        checked={showOnlyMissing}
                        onCheckedChange={checked => handleShowOnlyMissingChange(checked === true)}
                        className="h-5 w-5"
                        disabled={showOnlyCollected}
                    />
                    <Label htmlFor="showOnlyMissing" className="text-sm cursor-pointer flex-1">
                        Mostrar solo cartas faltantes
                    </Label>
                </div>
                
                {/* Checkbox para cartas en la colección */}
                <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md">
                    <Checkbox
                        id="showOnlyCollected"
                        checked={showOnlyCollected}
                        onCheckedChange={checked => handleShowOnlyCollectedChange(checked === true)}
                        className="h-5 w-5"
                        disabled={showOnlyMissing}
                    />
                    <Label htmlFor="showOnlyCollected" className="text-sm cursor-pointer flex-1">
                        Mostrar solo cartas en la colección
                    </Label>
                </div>
            </div>

            {/* Filtros: en columna para móvil, en fila para desktop */}
            <div className="block sm:hidden space-y-3">
                {/* Filtro de tipo - móvil */}
                <FilterItem
                    label="Tipo de carta"
                    value={typeFilter}
                    onChange={handleTypeFilterChange}
                    options={[
                        { value: 'all_types', label: 'Todos los tipos' },
                        ...Object.values(CardType).map(type => ({
                            value: type,
                            label: type.charAt(0).toUpperCase() + type.slice(1)
                        }))
                    ]}
                    mobileOptimized={true}
                    disabled={!haveTypeData}
                />
                
                {/* Filtro de energía - móvil */}
                <FilterItem
                    label="Energía"
                    value={energyFilter}
                    onChange={handleEnergyFilterChange}
                    options={[
                        { value: 'all_energies', label: 'Todas las energías' },
                        ...Object.values(CardEnergy).map(energy => ({
                            value: energy,
                            label: energy.charAt(0).toUpperCase() + energy.slice(1)
                        }))
                    ]}
                    mobileOptimized={true}
                    disabled={!haveEnergyData}
                />
                
                {/* Filtro de rareza - móvil */}
                <FilterItem
                    label="Rareza"
                    value={rarityFilter}
                    onChange={handleRarityFilterChange}
                    options={[
                        { value: 'all_rarities', label: 'Todas las rarezas' },
                        ...Object.values(CardRarity).map(rarity => ({
                            value: rarity,
                            label: rarity.charAt(0).toUpperCase() + rarity.slice(1)
                        }))
                    ]}
                    mobileOptimized={true}
                />
            </div>

            {/* Filtros en fila horizontal para desktop */}
            <div className="hidden sm:grid grid-cols-3 gap-3 mb-3">
                {/* Filtro de tipo de carta - desktop */}
                <FilterItem
                    label="Tipo de carta"
                    value={typeFilter}
                    onChange={(value) => {
                        console.log('Tipo de carta seleccionado:', value);
                        // Tratamiento especial para ROT - hardcodeado por ser problemático
                        if (value.toLowerCase() === 'rot') {
                            console.log('¡ROT seleccionado! - Aplicando tratamiento especial');
                        }
                        handleTypeFilterChange(value);
                    }}
                    options={[
                        { value: 'all_types', label: 'Todos los tipos' },
                        // Opción explícita para 'rot' que es problemático
                        { value: 'rot', label: 'Rot' },
                        ...Object.values(CardType)
                            .filter(type => type.toLowerCase() !== 'rot') // Excluimos rot para evitar duplicados
                            .map(type => ({
                                value: type,
                                label: type.charAt(0).toUpperCase() + type.slice(1)
                            }))
                    ]}
                    disabled={!haveTypeData}
                />
                
                {/* Filtro de energía - desktop */}
                <FilterItem
                    label="Energía"
                    value={energyFilter}
                    onChange={(value) => {
                        console.log('Energía seleccionada:', value);
                        handleEnergyFilterChange(value);
                    }}
                    options={[
                        { value: 'all_energies', label: 'Todas las energías' },
                        ...Object.values(CardEnergy).map(energy => ({
                            value: energy,
                            label: energy.charAt(0).toUpperCase() + energy.slice(1)
                        }))
                    ]}
                    disabled={!haveEnergyData}
                />
                
                {/* Filtro de rareza - desktop */}
                <FilterItem
                    label="Rareza"
                    value={rarityFilter}
                    onChange={handleRarityFilterChange}
                    options={[
                        { value: 'all_rarities', label: 'Todas las rarezas' },
                        ...Object.values(CardRarity).map(rarity => ({
                            value: rarity,
                            label: rarity.charAt(0).toUpperCase() + rarity.slice(1)
                        }))
                    ]}
                />
            </div>
        </div>
    );
}; 