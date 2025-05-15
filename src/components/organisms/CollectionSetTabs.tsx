import React, { useEffect, useMemo, useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import CollectionGrid from './CollectionGrid';
import { CardWithQuantity } from '@/types/collection';
import { CardSet } from '@/types/card';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useCollectionFilters } from '@/hooks/useCollectionFilters';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger
} from '@/components/atoms/Select';

interface CollectionSetTabsProps {
    sets: string[];
    activeSet: string;
    setActiveSet: (set: string) => void;
    collectionBySet: Record<string, {
        cards: CardWithQuantity[];
        cardsByRarity: Record<string, CardWithQuantity[]>;
        collectedCount: number;
        totalCount: number;
    }>;
    onUpdateQuantity: (cardId: string, quantity: number) => void;
    updatingCardId: string | null;
}

/**
 * CollectionSetTabs - Componente para mostrar pestañas con conjuntos de cartas
 */
export function CollectionSetTabs({
    sets,
    activeSet,
    setActiveSet,
    collectionBySet,
    onUpdateQuantity,
    updatingCardId
}: CollectionSetTabsProps) {
    const { user } = useAuth();
    const { groupCardsByRarity } = useCollectionFilters();
    const [totalCardsInSets, setTotalCardsInSets] = useState<Record<string, number>>({});
    const [, setIsLoadingTotals] = useState(true);
    const [, setIsMobile] = useState(false);

    // Usamos todos los sets del enum CardSet
    const allCardSets = Object.values(CardSet);
    
    // Set especial "Todos los sets" para mostrar todas las cartas combinadas
    const ALL_SETS_ID = "todos_los_sets";

    // Detectar tamaño de pantalla para modo móvil
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        // Revisar al cargar
        checkIfMobile();

        // Revisar al cambiar el tamaño de la ventana
        window.addEventListener('resize', checkIfMobile);

        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    // Cargamos el total real de cartas por set desde Firestore
    useEffect(() => {
        const loadTotalCards = async () => {
            if (!user) return;

            setIsLoadingTotals(true);
            try {
                // Consulta para obtener el número total de cartas por set desde Firestore
                const setsRef = collection(db, 'sets');
                const setsSnapshot = await getDocs(setsRef);

                const totals: Record<string, number> = {};

                setsSnapshot.forEach(doc => {
                    const setData = doc.data();
                    const setName = setData.name || doc.id;
                    const totalCards = setData.totalCards || 0;

                    // Convertir el nombre del set a minúsculas para comparar
                    const setNameLower = setName.toLowerCase();

                    // Encontrar el set en el enum que coincida (comparación por nombre)
                    const matchingSet = Object.values(CardSet).find(
                        enumSet => enumSet.toLowerCase() === setNameLower
                    );

                    if (matchingSet) {
                        totals[matchingSet] = totalCards;
                    }

                    console.log(`Set ${setName}: ${totalCards} cartas totales en Firestore`);
                });

                setTotalCardsInSets(totals);
                console.log('Totales de cartas por set cargados desde Firestore:', totals);
            } catch (error) {
                console.error('Error al cargar los totales de cartas:', error);
            } finally {
                setIsLoadingTotals(false);
            }
        };

        loadTotalCards();
    }, [user]);

    // Pre-calcular los datos de todos los sets
    const { allSetsData, globalStats, combinedSetData } = useMemo(() => {
        const setsData: Record<string, {
            cards: CardWithQuantity[],
            totalCards: number,
            collectedCards: number
        }> = {};

        // Variables para estadísticas globales
        let globalTotalCards = 0;
        let globalCollectedCards = 0;
        let totalUniqueCards = 0;
        
        // Para el set combinado, coleccionamos todas las cartas
        let allCards: CardWithQuantity[] = [];

        allCardSets.forEach(setName => {
            // Obtener los datos de este set desde collectionBySet
            const setData = collectionBySet[setName] || {
                cards: [],
                cardsByRarity: {},
                collectedCount: 0,
                totalCount: 0
            };

            // Calcular contadores
            const cards = setData.cards || [];
            // Usar el total real de Firestore si está disponible, sino la cantidad local
            const totalCards = totalCardsInSets[setName] || cards.length;
            const collectedCards = cards.filter(card =>
                card.mainCard && card.mainCard.inCollection
            ).length;

            // Acumular para estadísticas globales
            globalTotalCards += totalCards;
            globalCollectedCards += collectedCards;
            totalUniqueCards += totalCards; // Asumiendo que no hay duplicados entre sets
            
            // Acumular todas las cartas para el set combinado
            allCards = [...allCards, ...cards];

            // Guardar datos y contadores
            setsData[setName] = {
                cards,
                totalCards,
                collectedCards
            };

            console.log(`Set precalculado ${setName}:`, {
                totalCards,
                collectedCards
            });
        });

        // Calcular porcentaje de completado global
        const completionPercentage = globalTotalCards > 0
            ? Math.round((globalCollectedCards / globalTotalCards) * 100)
            : 0;

        // Crear los datos para el set combinado "Todos los sets"
        const allSetsCardsByRarity = groupCardsByRarity(allCards);
        
        const combinedSet = {
            cards: allCards,
            cardsByRarity: allSetsCardsByRarity,
            collectedCount: globalCollectedCards,
            totalCount: allCards.length
        };

        console.log('Estadísticas globales de la colección:', {
            totalCards: globalTotalCards,
            collectedCards: globalCollectedCards,
            uniqueCards: totalUniqueCards,
            completionPercentage: `${completionPercentage}%`,
            combinedSetCardsCount: allCards.length
        });

        return {
            allSetsData: setsData,
            globalStats: {
                totalCards: globalTotalCards,
                collectedCards: globalCollectedCards,
                uniqueCards: totalUniqueCards,
                completionPercentage
            },
            combinedSetData: combinedSet
        };
    }, [collectionBySet, allCardSets, totalCardsInSets, groupCardsByRarity]);

    // Logs para depuración
    useEffect(() => {
        console.log('CollectionSetTabs - Sets recibidos:', sets);
        console.log('CollectionSetTabs - Todos los sets del enum:', allCardSets);
        console.log('CollectionSetTabs - Set activo:', activeSet);
        console.log('CollectionSetTabs - Datos de colección:', collectionBySet);
        console.log('CollectionSetTabs - Datos precalculados:', allSetsData);
        console.log('CollectionSetTabs - Estadísticas globales:', globalStats);
        console.log('CollectionSetTabs - Totales de cartas en Firestore:', totalCardsInSets);
    }, [sets, activeSet, collectionBySet, allSetsData, globalStats, totalCardsInSets, allCardSets]);

    // Si no hay sets disponibles, mostrar mensaje
    if (allCardSets.length === 0) {
        console.warn('No hay sets disponibles para mostrar');
        return <div className="p-4 text-center text-gray-500">No hay datos disponibles para mostrar</div>;
    }

    // Si el set activo no existe en los datos disponibles, usar el primero
    const validActiveSet = activeSet === ALL_SETS_ID 
        ? ALL_SETS_ID 
        : allCardSets.includes(activeSet as CardSet) 
            ? activeSet 
            : ALL_SETS_ID;
    
    console.log('CollectionSetTabs - Set activo validado:', validActiveSet);

    return (
        <Tabs value={validActiveSet} onValueChange={setActiveSet} className="w-full">
            {/* Selector de sets para móvil */}
            <div className="block sm:hidden relative mb-3">
                <Select value={validActiveSet} onValueChange={setActiveSet}>
                    <SelectTrigger className="w-full h-12 text-left" id="mobile-set-selector">
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-muted-foreground">Set activo</span>
                            <span className="text-base font-medium capitalize">
                                {validActiveSet === ALL_SETS_ID ? "Todos los sets" : validActiveSet}
                            </span>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-[40vh]">
                        {/* Opción para todos los sets combinados */}
                        <SelectItem 
                            key={ALL_SETS_ID} 
                            value={ALL_SETS_ID} 
                            className={`py-3 border-b ${validActiveSet === ALL_SETS_ID ? 'bg-blue-600 text-white' : ''}`}
                        >
                            <div className="flex flex-col">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Todos los sets</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                        validActiveSet === ALL_SETS_ID 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-primary/10 text-primary'
                                    }`}>
                                        {globalStats.completionPercentage}%
                                    </span>
                                </div>
                                <div className={`text-xs mt-1 ${
                                    validActiveSet === ALL_SETS_ID ? 'text-blue-100' : 'text-muted-foreground'
                                }`}>
                                    {globalStats.collectedCards}/{globalStats.totalCards} cartas
                                </div>
                            </div>
                        </SelectItem>
                        
                        {/* Opciones para cada set individual */}
                        {allCardSets.map((setName) => {
                            // Datos del set actual
                            const setStats = allSetsData[setName] || {
                                cards: [],
                                totalCards: 0,
                                collectedCards: 0
                            };
                            
                            // Calcular porcentaje de completado
                            const completionPercentage = setStats.totalCards > 0
                                ? Math.round((setStats.collectedCards / setStats.totalCards) * 100)
                                : 0;
                                
                            const isActive = setName === validActiveSet;
                                
                            return (
                                <SelectItem 
                                    key={setName} 
                                    value={setName} 
                                    className={`py-3 border-b last:border-0 ${isActive ? 'bg-blue-600 text-white' : ''}`}
                                >
                                    <div className="flex flex-col capitalize">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{setName}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                isActive 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-primary/10 text-primary'
                                            }`}>
                                                {completionPercentage}%
                                            </span>
                                        </div>
                                        <div className={`text-xs mt-1 ${
                                            isActive ? 'text-blue-100' : 'text-muted-foreground'
                                        }`}>
                                            {setStats.collectedCards}/{setStats.totalCards} cartas
                                        </div>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Grid de sets para desktop con múltiples filas */}
            <div className="hidden sm:block relative mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {/* Botón para todos los sets combinados */}
                    <button 
                        key={ALL_SETS_ID} 
                        onClick={() => setActiveSet(ALL_SETS_ID)}
                        className={`p-3 rounded-md border transition-all duration-200 text-left hover:bg-primary/5 ${
                            validActiveSet === ALL_SETS_ID
                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                            : 'bg-card border-muted hover:border-primary/20'
                        }`}
                    >
                        <div className="flex w-full justify-between items-center">
                            <span className="font-medium truncate">Todos los sets</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ml-2 whitespace-nowrap ${
                                validActiveSet === ALL_SETS_ID 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-muted/80 text-muted-foreground'
                            }`}>
                                {globalStats.completionPercentage}%
                            </span>
                        </div>
                        <div className={`text-xs mt-1 ${validActiveSet === ALL_SETS_ID ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            {globalStats.collectedCards}/{globalStats.totalCards} cartas
                        </div>
                    </button>
                    
                    {/* Botones para cada set individual */}
                    {allCardSets.map((setName) => {
                        // Datos del set actual
                        const setStats = allSetsData[setName] || {
                            cards: [],
                            totalCards: 0,
                            collectedCards: 0
                        };
                        
                        // Calcular porcentaje de completado
                        const completionPercentage = setStats.totalCards > 0
                            ? Math.round((setStats.collectedCards / setStats.totalCards) * 100)
                            : 0;
                            
                        const isActive = setName === validActiveSet;
                        
                        return (
                            <button 
                                key={setName} 
                                onClick={() => setActiveSet(setName)}
                                className={`p-3 rounded-md border transition-all duration-200 text-left hover:bg-primary/5 ${
                                    isActive 
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                                    : 'bg-card border-muted hover:border-primary/20'
                                }`}
                            >
                                <div className="flex w-full justify-between items-center">
                                    <span className="font-medium truncate capitalize">{setName}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ml-2 whitespace-nowrap ${
                                        isActive ? 'bg-blue-500 text-white' : 'bg-muted/80 text-muted-foreground'
                                    }`}>
                                        {completionPercentage}%
                                    </span>
                                </div>
                                <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                    {setStats.collectedCards}/{setStats.totalCards} cartas
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Mostrar estadísticas globales en un panel compacto */}
            <div className="bg-muted/30 rounded-lg p-3 mb-3 text-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Colección completa</span>
                    <span className="font-bold text-primary">{globalStats.completionPercentage}%</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{globalStats.collectedCards} coleccionadas</span>
                    <span>{globalStats.totalCards} totales</span>
                </div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${globalStats.completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Contenido de las pestañas */}
            <div className="outline-none">
                {/* Componente de grid actualizado */}
                <CollectionGrid
                    cards={validActiveSet === ALL_SETS_ID 
                        ? combinedSetData.cards 
                        : collectionBySet[validActiveSet]?.cards || []}
                    cardsByRarity={validActiveSet === ALL_SETS_ID 
                        ? combinedSetData.cardsByRarity 
                        : collectionBySet[validActiveSet]?.cardsByRarity || {}}
                    updateCardQuantity={onUpdateQuantity}
                    updatingCardId={updatingCardId}
                />
            </div>
        </Tabs>
    );
}

export default CollectionSetTabs; 