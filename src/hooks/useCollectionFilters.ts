import { useState, useCallback } from 'react';
import { CardType, CardEnergy, CardRarity } from '@/types/card';
import { CardWithQuantity } from '@/types/collection';
import { CardSet } from '@/types/card';

export interface CollectionFiltersState {
    searchTerm: string;
    typeFilter: CardType | 'all_types';
    energyFilter: CardEnergy | 'all_energies';
    rarityFilter: CardRarity | 'all_rarities';
    showOnlyMissing: boolean;
    showOnlyCollected: boolean;
}

const defaultFilters: CollectionFiltersState = {
    searchTerm: '',
    typeFilter: 'all_types',
    energyFilter: 'all_energies',
    rarityFilter: 'all_rarities',
    showOnlyMissing: false,
    showOnlyCollected: false
};

/**
 * Hook personalizado para gestionar los filtros de la colección
 * @returns Estado y funciones para manipular los filtros
 */
export function useCollectionFilters() {
    const [filters, setFilters] = useState<CollectionFiltersState>(defaultFilters);

    // Actualizar filtros parcialmente
    const updateFilters = useCallback((newFilters: Partial<CollectionFiltersState>) => {
        setFilters(prevFilters => {
            // Si se activa showOnlyCollected, desactivar showOnlyMissing y viceversa
            if (newFilters.showOnlyCollected && newFilters.showOnlyCollected !== prevFilters.showOnlyCollected) {
                return {
                    ...prevFilters,
                    ...newFilters,
                    showOnlyMissing: false
                };
            }
            
            if (newFilters.showOnlyMissing && newFilters.showOnlyMissing !== prevFilters.showOnlyMissing) {
                return {
                    ...prevFilters,
                    ...newFilters,
                    showOnlyCollected: false
                };
            }
            
            return {
                ...prevFilters,
                ...newFilters
            };
        });
    }, []);

    // Limpiar todos los filtros
    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    // Comprobar si hay filtros activos
    const hasActiveFilters = useCallback(() => {
        return filters.searchTerm !== '' ||
            filters.typeFilter !== 'all_types' ||
            filters.energyFilter !== 'all_energies' ||
            filters.rarityFilter !== 'all_rarities' ||
            filters.showOnlyMissing ||
            filters.showOnlyCollected;
    }, [filters]);

    // Aplicar filtros a las cartas
    const applyFilters = useCallback((cards: CardWithQuantity[]): CardWithQuantity[] => {
        console.log('Filtros actuales:', JSON.stringify(filters));
        
        // Verificar si las cartas tienen los campos necesarios para filtrar
        const firstFewCards = cards.slice(0, 5);
        console.log('MUESTRA DE CARTAS PARA DIAGNÓSTICO:', 
            firstFewCards.map(c => ({
                name: c.mainCard.name,
                // Mostrar todos los campos posibles para diagnóstico
                cardType: c.mainCard.cardType || 'undefined',
                type: c.mainCard.type || 'undefined',
                cardEnergy: c.mainCard.cardEnergy || 'undefined',
                energy: c.mainCard.energy || 'undefined',
                rarity: c.mainCard.rarity || 'undefined',
                fullId: c.mainCard.fullId || 'undefined'
            }))
        );
        
        // Determinar si las cartas tienen cardType y cardEnergy definidos
        // También verificamos los campos legacy (type, energy) para compatibilidad
        const haveTypeData = cards.some(c => 
            c.mainCard.cardType !== undefined || c.mainCard.type !== undefined
        );
        const haveEnergyData = cards.some(c => 
            c.mainCard.cardEnergy !== undefined || c.mainCard.energy !== undefined
        );
        
        console.log('Estado de datos en cartas:', {
            tienenTipo: haveTypeData,
            tienenEnergia: haveEnergyData,
            camposDisponibles: {
                cardType: cards.some(c => c.mainCard.cardType !== undefined),
                type: cards.some(c => c.mainCard.type !== undefined),
                cardEnergy: cards.some(c => c.mainCard.cardEnergy !== undefined),
                energy: cards.some(c => c.mainCard.energy !== undefined)
            }
        });
        
        // Guardar en localStorage para que CollectionFilters pueda usar esta información
        localStorage.setItem('haveTypeData', haveTypeData.toString());
        localStorage.setItem('haveEnergyData', haveEnergyData.toString());
        
        // Si no hay datos de tipo o energía, deshabilitar esos filtros
        const effectiveTypeFilter = !haveTypeData ? 'all_types' : filters.typeFilter;
        const effectiveEnergyFilter = !haveEnergyData ? 'all_energies' : filters.energyFilter;
        
        if (!haveTypeData && filters.typeFilter !== 'all_types') {
            console.warn('Las cartas no tienen datos de tipo, ignorando filtro de tipo');
        }
        
        if (!haveEnergyData && filters.energyFilter !== 'all_energies') {
            console.warn('Las cartas no tienen datos de energía, ignorando filtro de energía');
        }
        
        return cards.filter(card => {
            const { mainCard } = card;

            // Filtrar por nombre o por fullId
            if (filters.searchTerm) {
                const searchTermLower = filters.searchTerm.toLowerCase();
                const nameMatches = mainCard.name.toLowerCase().includes(searchTermLower);
                const fullIdMatches = mainCard.fullId ? mainCard.fullId.toLowerCase().includes(searchTermLower) : false;
                
                // Si ni el nombre ni el fullId coinciden, descartar esta carta
                if (!nameMatches && !fullIdMatches) {
                    return false;
                }
            }

            // Filtrar por tipo de carta - solo si hay datos de tipo
            if (effectiveTypeFilter !== 'all_types') {
                // Intentamos obtener el tipo de cualquiera de los dos campos (nuevo o legacy)
                // Priorizamos el nuevo campo estándar (cardType)
                const typeValue = mainCard.cardType || mainCard.type;
                
                // Si no hay tipo definido en ninguno de los campos, no coincide
                if (typeValue === undefined) {
                    return false;
                }
                
                const cardTypeStr = String(typeValue).toLowerCase().trim();
                const filterTypeStr = String(effectiveTypeFilter).toLowerCase().trim();
                
                // Añadir depuración para el filtro de "rot" específicamente
                if (filterTypeStr === "rot") {
                    console.log(`[Filtro ROT] Evaluando carta: ${mainCard.name}, tipo: ${cardTypeStr}`);
                }
                
                // Intentar varias formas de coincidir
                const typeMatches = [
                    cardTypeStr === filterTypeStr,
                    cardTypeStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
                    filterTypeStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                ];
                
                // Depuración detallada
                if (filterTypeStr === "rot" && typeMatches.some(match => match === true)) {
                    console.log(`✅ [Filtro ROT] Carta "${mainCard.name}" con tipo "${cardTypeStr}" coincide con "${filterTypeStr}"`);
                }
                
                if (!typeMatches.some(match => match === true)) {
                    return false;
                }
            }

            // Filtrar por tipo de energía - solo si hay datos de energía
            if (effectiveEnergyFilter !== 'all_energies') {
                // Intentamos obtener la energía de cualquiera de los dos campos (nuevo o legacy)
                // Priorizamos el nuevo campo estándar (cardEnergy)
                const energyValue = mainCard.cardEnergy || mainCard.energy;
                
                // Si no hay energía definida en ninguno de los campos, no coincide
                if (energyValue === undefined) {
                    return false;
                }
                
                const cardEnergyStr = String(energyValue).toLowerCase().trim();
                const filterEnergyStr = String(effectiveEnergyFilter).toLowerCase().trim();
                
                // Intentar varias formas de coincidir
                const energyMatches = [
                    cardEnergyStr === filterEnergyStr,
                    cardEnergyStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
                    filterEnergyStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                ];
                
                if (!energyMatches.some(match => match === true)) {
                    return false;
                }
            }

            // Filtrar por rareza (esto sí parece funcionar)
            if (filters.rarityFilter !== 'all_rarities') {
                if (!mainCard.rarity) return false;
                
                const filterRarity = String(filters.rarityFilter).toLowerCase().trim();
                const cardRarity = String(mainCard.rarity).toLowerCase().trim();
                
                if (filterRarity !== cardRarity) {
                    return false;
                }
            }

            // Filtrar para mostrar solo cartas no coleccionadas
            if (filters.showOnlyMissing && mainCard.inCollection) {
                return false;
            }
            
            // Filtrar para mostrar solo cartas coleccionadas
            if (filters.showOnlyCollected && !mainCard.inCollection) {
                return false;
            }

            return true;
        });
    }, [filters]);

    // Agrupar cartas por rareza
    const groupCardsByRarity = useCallback((cards: CardWithQuantity[]): Record<string, CardWithQuantity[]> => {
        const grouped: Record<string, CardWithQuantity[]> = {};

        cards.forEach(card => {
            const rarity = card.mainCard.rarity || 'unknown';
            if (!grouped[rarity]) {
                grouped[rarity] = [];
            }
            grouped[rarity].push(card);
        });

        // Ordenar cada grupo de rareza por cardNumber
        Object.keys(grouped).forEach(rarity => {
            // Log para depuración antes de ordenar
            console.log(`Ordenando cartas de rareza ${rarity}, total: ${grouped[rarity].length}`);

            if (grouped[rarity].length > 0) {
                console.log('Ejemplo cardNumber antes de ordenar:',
                    grouped[rarity].slice(0, 3).map(card => ({
                        name: card.mainCard.name,
                        cardNumber: card.mainCard.cardNumber,
                        fullId: card.mainCard.fullId
                    }))
                );
            }

            grouped[rarity].sort((a, b) => {
                // Extraer números de cardNumber, asignando valores por defecto si son undefined
                const numA = a.mainCard.cardNumber !== undefined ? Number(a.mainCard.cardNumber) : 999999;
                const numB = b.mainCard.cardNumber !== undefined ? Number(b.mainCard.cardNumber) : 999999;

                // Log para depurar casos problemáticos
                if (isNaN(numA) || isNaN(numB)) {
                    console.warn('Valores no numéricos encontrados:', {
                        cardA: { name: a.mainCard.name, cardNumber: a.mainCard.cardNumber },
                        cardB: { name: b.mainCard.name, cardNumber: b.mainCard.cardNumber }
                    });
                }

                // Como alternativa, si cardNumber no está disponible o es inválido,
                // intentamos extraer un número del fullId (ejemplo: IDRMP-001 → extraemos el 1)
                if (numA === 999999 || numB === 999999 || isNaN(numA) || isNaN(numB)) {
                    const extractNumber = (id: string | undefined) => {
                        if (!id) return 999999;
                        const match = id.match(/(\d+)$/);
                        return match ? parseInt(match[1], 10) : 999999;
                    };

                    const idNumA = extractNumber(a.mainCard.fullId);
                    const idNumB = extractNumber(b.mainCard.fullId);

                    return idNumA - idNumB;
                }

                return numA - numB;
            });

            // Log para depuración después de ordenar
            if (grouped[rarity].length > 0) {
                console.log('Ejemplo cardNumber después de ordenar:',
                    grouped[rarity].slice(0, 3).map(card => ({
                        name: card.mainCard.name,
                        cardNumber: card.mainCard.cardNumber,
                        fullId: card.mainCard.fullId
                    }))
                );
            }
        });

        return grouped;
    }, []);

    // Agrupar cartas por set
    const groupCardsBySet = useCallback((cards: CardWithQuantity[]): Record<string, CardWithQuantity[]> => {
        const grouped: Record<string, CardWithQuantity[]> = {};

        // Inicializar todos los sets del enum
        Object.values(CardSet).forEach(setName => {
            grouped[setName] = [];
        });

        // Agrupar las cartas
        cards.forEach(card => {
            const cardSetValue = card.mainCard.cardSet;

            // Usar el valor del cardSet si está definido y es válido, sino usar el primer valor del enum
            let set: string;

            if (cardSetValue && Object.values(CardSet).includes(cardSetValue)) {
                set = cardSetValue;
            } else {
                set = Object.values(CardSet)[0]; // Usar el primer set por defecto
            }

            // Ya inicializamos todos los sets, así que este check es redundante pero por seguridad
            if (!grouped[set]) {
                grouped[set] = [];
            }

            grouped[set].push(card);
        });

        return grouped;
    }, []);

    return {
        filters,
        updateFilters,
        clearFilters,
        hasActiveFilters,
        applyFilters,
        groupCardsByRarity,
        groupCardsBySet
    };
} 