import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Card, CardDetails, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { Deck, DeckCardSlot } from '@/types/deck';
import useDeckEditor from '@/hooks/useDeckEditor';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { Checkbox } from '@/components/atoms/Checkbox';
import { Label } from '@/components/atoms/Label';
import { Image } from '@/components/atoms/Image';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/atoms/Select';
import { Search, Plus, Minus, Save, ArrowLeft, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/Dialog';
import DeckEditorHeader from '@/components/organisms/DeckEditorHeader';
import DeckEditorCatalog from '@/components/organisms/DeckEditorCatalog';
import DeckEditorOrganizer from '@/components/organisms/DeckEditorOrganizer';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, pointerWithin, rectIntersection, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

/**
 * Editor de Mazos - Componente para crear y editar mazos
 * @returns Componente React del editor de mazos
 */

export default function DeckEditorPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const pathParts = location.split('/');
  const lastSegment = pathParts[pathParts.length - 1] || '';
  const isNew = lastSegment === 'new';
  const deckId = isNew ? '' : lastSegment;

  const {
    deckName,
    setDeckName,
    deckDescription,
    setDeckDescription,
    isPublic,
    setIsPublic,
    isLoading,
    isSaving,
    confirmDeleteDialogOpen,
    setConfirmDeleteDialogOpen,
    allCards,
    filteredCards,
    isLoadingCards,
    deckCards,
    deckCardOrder,
    setDeckCardOrder,
    activeId,
    isDragging,
    customOrder,
    setCustomOrder,
    organizedDeck,
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
    nameError,
    setNameError,
    typeOptions,
    energyOptions,
    rarityOptions,
    setOptions,
    totalCards,
  handleSaveDeck,
  handleDeleteDeck,
  handleAddCard,
  handleRemoveCard,
    setOrganizedDeck,
    setActiveId,
    setIsDragging
  } = useDeckEditor(user, deckId, isNew, navigate);

  // Lógica de Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reducir distancia para activación
        tolerance: 5, // Añadir tolerancia
        delay: 0, // Sin retraso en la activación
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const adendeiTypes: CardType[] = [
    CardType.ADENDEI,
    CardType.ADENDEI_TITAN,
    CardType.ADENDEI_GUARDIAN,
    CardType.ADENDEI_CATRIN,
    CardType.ADENDEI_RESURRECTO,
    CardType.ADENDEI_KOSMICO,
    CardType.ADENDEI_EQUINO,
    CardType.ADENDEI_ABISMAL,
    CardType.ADENDEI_INFECTADO,
    CardType.RAVA
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
    setIsDragging(true);
    console.log('Drag start:', active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    if (!over) return;

    // Si se soltó sobre la zona de basura, eliminar la carta correspondiente
    if (over.id === 'trash-dropzone') {
      // Determinar el id de la carta activa a partir de active.id
      const activeIdStr = String(active.id);
      const [section, indexStr] = activeIdStr.split('-');
      const idx = parseInt(indexStr);

      let cardIdToRemove: string | undefined;
      switch (section) {
        case 'mainAdendei':
          cardIdToRemove = organizedDeck.mainAdendeis[idx]?.id;
          break;
        case 'rot':
          cardIdToRemove = organizedDeck.rotCards[idx]?.id;
          break;
        case 'ixim':
          cardIdToRemove = organizedDeck.iximCards[idx]?.id;
          break;
        case 'other':
          cardIdToRemove = organizedDeck.otherCards[idx]?.id;
          break;
        case 'protector1':
          cardIdToRemove = organizedDeck.protector1?.id;
          break;
        case 'protector2':
          cardIdToRemove = organizedDeck.protector2?.id;
          break;
        case 'bio':
          cardIdToRemove = organizedDeck.bio?.id;
          break;
        default:
          cardIdToRemove = undefined;
      }

      if (cardIdToRemove) {
        handleRemoveCard(cardIdToRemove);
      }

      return; // evitar demás lógica de reordenamiento
    }

    if (active.id !== over.id) {
      const [activeSection, activeIndexStr] = String(active.id).split('-');
      const [overSection, overIndexStr] = String(over.id).split('-');
      const activeIndex = parseInt(activeIndexStr);
      const overIndex = parseInt(overIndexStr);

      setOrganizedDeck(prev => {
        const newDeck = { ...prev };

        // Solo intercambiar cartas si están en la misma sección
        if (activeSection === overSection) {
          switch (activeSection) {
            case 'protector1': 
            case 'protector2': {
              // No hacer nada aquí, porque protector1 y protector2 son diferentes secciones
              break;
            }
            case 'bio': {
              // Bio no se puede reordenar consigo mismo
              break;
            }
            case 'mainAdendei': {
              const newMainAdendeis = [...prev.mainAdendeis];
              // Crear un array de tamaño fijo para mantener posiciones
              const fixedArray = new Array(24).fill(undefined);
              
              // Colocar las cartas existentes en sus posiciones
              prev.mainAdendeis.forEach((card, idx) => {
                fixedArray[idx] = card;
              });
              
              const activeCard = fixedArray[activeIndex];
              const overCard = fixedArray[overIndex];
              
              if (activeCard && overCard) {
                // Intercambio directo entre dos cartas
                fixedArray[activeIndex] = overCard;
                fixedArray[overIndex] = activeCard;
                
                // Actualizar customOrder para adendeis
                setCustomOrder(prevOrder => {
                  const newAdendeis = [...prevOrder.adendeis];
                  const activeCardIdx = newAdendeis.findIndex(id => id === activeCard.id);
                  const overCardIdx = newAdendeis.findIndex(id => id === overCard.id);
                  
                  if (activeCardIdx !== -1 && overCardIdx !== -1) {
                    [newAdendeis[activeCardIdx], newAdendeis[overCardIdx]] = [newAdendeis[overCardIdx], newAdendeis[activeCardIdx]];
                  }
                  
                  return { ...prevOrder, adendeis: newAdendeis };
                });
              } else if (activeCard && !overCard) {
                // Mover carta a posición vacía
                fixedArray[overIndex] = activeCard;
                fixedArray[activeIndex] = undefined;
              }
              
              // Filtrar elementos undefined para mantener array compacto pero en orden
              newDeck.mainAdendeis = fixedArray.filter(card => card !== undefined);
              break;
            }
            case 'rot': {
              const newRotCards = [...prev.rotCards];
              const fixedArray = new Array(4).fill(undefined);
              
              prev.rotCards.forEach((card, idx) => {
                fixedArray[idx] = card;
              });
              
              const activeCard = fixedArray[activeIndex];
              const overCard = fixedArray[overIndex];
              
              if (activeCard && overCard) {
                fixedArray[activeIndex] = overCard;
                fixedArray[overIndex] = activeCard;
                
                // Actualizar customOrder para rot
                setCustomOrder(prevOrder => {
                  const newRot = [...prevOrder.rot];
                  const activeCardIdx = newRot.findIndex(id => id === activeCard.id);
                  const overCardIdx = newRot.findIndex(id => id === overCard.id);
                  
                  if (activeCardIdx !== -1 && overCardIdx !== -1) {
                    [newRot[activeCardIdx], newRot[overCardIdx]] = [newRot[overCardIdx], newRot[activeCardIdx]];
                  }
                  
                  return { ...prevOrder, rot: newRot };
                });
              } else if (activeCard && !overCard) {
                fixedArray[overIndex] = activeCard;
                fixedArray[activeIndex] = undefined;
              }
              
              newDeck.rotCards = fixedArray.filter(card => card !== undefined);
              break;
            }
            case 'ixim': {
              const newIximCards = [...prev.iximCards];
              const fixedArray = new Array(4).fill(undefined);
              
              prev.iximCards.forEach((card, idx) => {
                fixedArray[idx] = card;
              });
              
              const activeCard = fixedArray[activeIndex];
              const overCard = fixedArray[overIndex];
              
              if (activeCard && overCard) {
                fixedArray[activeIndex] = overCard;
                fixedArray[overIndex] = activeCard;
                
                // Actualizar customOrder para ixim
                setCustomOrder(prevOrder => {
                  const newIxim = [...prevOrder.ixim];
                  const activeCardIdx = newIxim.findIndex(id => id === activeCard.id);
                  const overCardIdx = newIxim.findIndex(id => id === overCard.id);
                  
                  if (activeCardIdx !== -1 && overCardIdx !== -1) {
                    [newIxim[activeCardIdx], newIxim[overCardIdx]] = [newIxim[overCardIdx], newIxim[activeCardIdx]];
                  }
                  
                  return { ...prevOrder, ixim: newIxim };
                });
              } else if (activeCard && !overCard) {
                fixedArray[overIndex] = activeCard;
                fixedArray[activeIndex] = undefined;
              }
              
              newDeck.iximCards = fixedArray.filter(card => card !== undefined);
              break;
            }
            case 'other': {
              const newOtherCards = [...prev.otherCards];
              const activeCard = newOtherCards[activeIndex];
              const overCard = newOtherCards[overIndex];
              
              if (activeCard && overCard) {
                newOtherCards[activeIndex] = overCard;
                newOtherCards[overIndex] = activeCard;
                
                // Actualizar customOrder para others
                setCustomOrder(prevOrder => {
                  const newOthers = [...prevOrder.others];
                  const activeCardIdx = newOthers.findIndex(id => id === activeCard.id);
                  const overCardIdx = newOthers.findIndex(id => id === overCard.id);
                  
                  if (activeCardIdx !== -1 && overCardIdx !== -1) {
                    [newOthers[activeCardIdx], newOthers[overCardIdx]] = [newOthers[overCardIdx], newOthers[activeCardIdx]];
                  }
                  
                  return { ...prevOrder, others: newOthers };
                });
              } else if (activeCard && !overCard) {
                newOtherCards[overIndex] = activeCard;
                newOtherCards[activeIndex] = undefined as any;
              }
              
              newDeck.otherCards = newOtherCards.filter(card => card !== undefined);
              break;
            }
          }
        } else if (
          // Intercambio entre protectores de diferentes posiciones
          (activeSection === 'protector1' && overSection === 'protector2') ||
          (activeSection === 'protector2' && overSection === 'protector1')
        ) {
          if (activeSection === 'protector1' && overSection === 'protector2') {
            const temp = prev.protector1;
            newDeck.protector1 = prev.protector2;
            newDeck.protector2 = temp;
            
            // Actualizar customOrder para protectores
            if (temp && prev.protector2) {
              setCustomOrder(prevOrder => {
                const newProtectors = [...prevOrder.protectors];
                const activeIdx = newProtectors.findIndex(id => id === temp.id);
                const overIdx = newProtectors.findIndex(id => id === prev.protector2!.id);
                
                if (activeIdx !== -1 && overIdx !== -1) {
                  [newProtectors[activeIdx], newProtectors[overIdx]] = [newProtectors[overIdx], newProtectors[activeIdx]];
                }
                
                return { ...prevOrder, protectors: newProtectors };
              });
            }
          } else if (activeSection === 'protector2' && overSection === 'protector1') {
            const temp = prev.protector2;
            newDeck.protector2 = prev.protector1;
            newDeck.protector1 = temp;
            
            // Actualizar customOrder para protectores
            if (temp && prev.protector1) {
              setCustomOrder(prevOrder => {
                const newProtectors = [...prevOrder.protectors];
                const activeIdx = newProtectors.findIndex(id => id === temp.id);
                const overIdx = newProtectors.findIndex(id => id === prev.protector1!.id);
                
                if (activeIdx !== -1 && overIdx !== -1) {
                  [newProtectors[activeIdx], newProtectors[overIdx]] = [newProtectors[overIdx], newProtectors[activeIdx]];
                }
                
                return { ...prevOrder, protectors: newProtectors };
              });
            }
          }
        }
        
        return newDeck;
      });
    }
  };

  // Componente Sortable Card con mejor manejo de eventos
  const SortableCard = ({ card, id }: { card: CardDetails, id: string }) => {
    const { 
      attributes, 
      listeners, 
      setNodeRef, 
      transform, 
      transition,
      isDragging 
    } = useSortable({ 
      id,
      data: { card },
    });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      // Ocultar la carta original durante el drag
      opacity: isDragging ? 0 : 1,
      touchAction: 'none',
      width: card.cardType === CardType.BIO ? '300px' : '157px',
      height: '220px',
    };
    
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className={`cursor-grab active:cursor-grabbing touch-manipulation ${
          card.cardType === CardType.BIO ? 'w-[300px] h-[157px] mx-auto' : 'w-[157px] h-[220px]'
        }`}
        data-id={id}
        key={card.id} // Forzar re-render si cambia la carta
      >
        {renderDeckCard(card)}
      </div>
    );
  };

  // Zona droppable grande para eliminar cartas
  const DroppableTrash: React.FC<{ visible: boolean }> = ({ visible }) => {
    const { isOver, setNodeRef } = useDroppable({ id: 'trash-dropzone' });

    if (!visible) return null;

    return (
      <div
        ref={setNodeRef}
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-[900px] w-[90%] pointer-events-auto transition-all ${isOver ? 'scale-105' : ''}`}
        aria-hidden={!visible}
      >
        <div className={`w-full flex items-center justify-center p-4 rounded-md shadow-lg ${isOver ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-red-500 rounded-full p-3 shadow-lg">
              <Trash2 size={28} className="text-white" />
            </div>
            <div className="text-sm font-medium">
              {isOver ? 'Suelta aquí para eliminar' : 'Arrastra aquí para eliminar carta'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Estados para controlar las secciones colapsables
  const [isRotExpanded, setIsRotExpanded] = useState(true);
  const [isIximExpanded, setIsIximExpanded] = useState(true);

  // Renderizar el organizador
  const renderDeckOrganizer = () => {
    // Obtener la carta que se está arrastrando para el DragOverlay
    const activeCard = activeId ? 
      organizedDeck.mainAdendeis.find((_, idx) => `mainAdendei-${idx}` === activeId) ||
      organizedDeck.rotCards.find((_, idx) => `rot-${idx}` === activeId) ||
      organizedDeck.iximCards.find((_, idx) => `ixim-${idx}` === activeId) ||
      organizedDeck.otherCards.find((_, idx) => `other-${idx}` === activeId) ||
      (activeId === 'protector1-0' ? organizedDeck.protector1 : null) ||
      (activeId === 'protector2-0' ? organizedDeck.protector2 : null) ||
      (activeId === 'bio-0' ? organizedDeck.bio : null)
      : null;

    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Fila 1: Protector principal, protector secundario y bio */}
          <div>
            <h3 className="font-medium text-sm mb-2">Protectores y Bio</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
              }`}>
                {organizedDeck.protector1 ? (
                  <div className="relative w-full h-full">
                    <SortableCard 
                      card={organizedDeck.protector1} 
                      id="protector1-0" 
                    />
                    <div className="absolute top-2 right-2 z-50">
                      <button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.protector1!.id); }}
                        aria-label={`Eliminar ${organizedDeck.protector1.name} del mazo`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    </div>
                    Protector Principal
                  </div>
                )}
              </div>
              <div className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
              }`}>
                {organizedDeck.protector2 ? (
                  <div className="relative w-full h-full">
                    <SortableCard 
                      card={organizedDeck.protector2} 
                      id="protector2-0" 
                    />
                    <div className="absolute top-2 right-2 z-50">
                      <button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.protector2!.id); }}
                        aria-label={`Eliminar ${organizedDeck.protector2.name} del mazo`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    </div>
                    Protector Secundario
                  </div>
                )}
              </div>
              <div className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
              }`}>
                {organizedDeck.bio ? (
                  <div className="relative w-full h-full">
                    <SortableCard 
                      card={organizedDeck.bio} 
                      id="bio-0" 
                    />
                    <div className="absolute top-2 right-2 z-50">
                      <button
                        type="button"
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.bio!.id); }}
                        aria-label={`Eliminar ${organizedDeck.bio.name} del mazo`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    </div>
                    Bio
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fila 2: Cartas Rot */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Cartas Rot {organizedDeck.rotCards.length > 0 && `(${organizedDeck.rotCards.length})`}</h3>
              {/* Siempre mostrar el botón de expandir/contraer para permitir colapsar aunque haya cartas */}
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                onClick={() => setIsRotExpanded(!isRotExpanded)}
              >
                {isRotExpanded ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    Contraer
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    Expandir
                  </>
                )}
              </button>
            </div>
            {isRotExpanded && (
              <div className="grid grid-cols-5 gap-3">
                {Array(5).fill(null).map((_, idx) => (
                  <div key={`rot-${idx}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                    isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
                  }`} data-droppable-id={`rot-${idx}}`}>
                    {organizedDeck.rotCards[idx] ? (
                      <div className="relative w-full h-full">
                        <SortableCard 
                          card={organizedDeck.rotCards[idx]} 
                          id={`rot-${idx}`} 
                        />
                        <div className="absolute top-2 right-2 z-50">
                          <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.rotCards[idx].id); }}
                            aria-label={`Eliminar ${organizedDeck.rotCards[idx].name} del mazo`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        <div className="mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                        </div>
                        Rot {idx + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fila 3: Cartas Ixim */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Cartas Ixim {organizedDeck.iximCards.length > 0 && `(${organizedDeck.iximCards.length})`}</h3>
              {/* Siempre mostrar el botón de expandir/contraer para Ixim */}
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                onClick={() => setIsIximExpanded(!isIximExpanded)}
              >
                {isIximExpanded ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    Contraer
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    Expandir
                  </>
                )}
              </button>
            </div>
            {isIximExpanded && (
              <div className="grid grid-cols-5 gap-3">
                {Array(5).fill(null).map((_, idx) => (
                  <div key={`ixim-${idx}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                    isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
                  }`} data-droppable-id={`ixim-${idx}`}> 
                    {organizedDeck.iximCards[idx] ? (
                      <div className="relative w-full h-full">
                        <SortableCard 
                          card={organizedDeck.iximCards[idx]} 
                          id={`ixim-${idx}`} 
                        />
                        <div className="absolute top-2 right-2 z-50">
                          <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.iximCards[idx].id); }}
                            aria-label={`Eliminar ${organizedDeck.iximCards[idx].name} del mazo`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        <div className="mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                        </div>
                        Ixim {idx + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filas 4-8: Adendeis y Rava (5 filas de 3 columnas = 15 slots mínimos) */}
          <div>
            <h3 className="font-medium text-sm mb-2">Adendeis y Rava (mínimo 15)</h3>
            {/* Calcular el número de filas necesarias basado en las cartas existentes */}
            {(() => {
              const minRows = 5; // Mínimo 5 filas (15 slots)
              const cardsCount = organizedDeck.mainAdendeis.length;
              const maxRows = Math.ceil(24 / 3); // Máximo 8 filas (24 slots)
              const neededRows = Math.max(minRows, Math.ceil(cardsCount / 3));
              const totalRows = Math.min(neededRows, maxRows);
              
              return Array(totalRows).fill(null).map((_, rowIdx) => (
                <div key={`adendei-row-${rowIdx}`} className="grid grid-cols-3 gap-3 mb-3">
                  {Array(3).fill(null).map((_, colIdx) => {
                    const cardIndex = rowIdx * 3 + colIdx;
                    return (
                      <div key={`adendei-${cardIndex}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                        isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
                      }`} data-droppable-id={`mainAdendei-${cardIndex}`}>
                        {organizedDeck.mainAdendeis[cardIndex] ? (
                          <div className="relative w-full h-full">
                            <SortableCard 
                              card={organizedDeck.mainAdendeis[cardIndex]} 
                              id={`mainAdendei-${cardIndex}`} 
                            />
                            <div className="absolute top-2 right-2 z-50">
                              <button
                                type="button"
                                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.mainAdendeis[cardIndex].id); }}
                                aria-label={`Eliminar ${organizedDeck.mainAdendeis[cardIndex].name} del mazo`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground">
                            <div className="mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                            </div>
                            Adendei {cardIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* Fila 9+: Cartas adicionales (si existen) */}
          {organizedDeck.otherCards.length > 0 && (
            <div>
              <h3 className="font-medium text-sm mb-2">Cartas adicionales</h3>
              <div className="grid grid-cols-3 gap-3">
                {organizedDeck.otherCards.map((card, idx) => (
                    <div key={`other-${idx}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${
                    isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'
                  }`} data-droppable-id={`other-${idx}`}>
                    <div className="relative w-full h-full">
                      <SortableCard 
                        card={card} 
                        id={`other-${idx}`} 
                      />
                      <div className="absolute top-2 right-2 z-50">
                        <button
                          type="button"
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.id); }}
                          aria-label={`Eliminar ${card.name} del mazo`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DragOverlay para mostrar la carta que se está moviendo */}
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="cursor-grabbing transform rotate-3 scale-105 shadow-2xl border-2 border-blue-400 rounded-md overflow-hidden bg-white">
              <div className="relative w-[157px] h-[220px]" style={{ aspectRatio: '2.5/3.5' }}>
                <Image
                  src={activeCard.imageUrl}
                  alt={activeCard.name}
                  className="object-cover"
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  // Renderizar carta del deck (asegura re-render usando key)
  const renderDeckCard = (card: CardDetails) => (
    <div key={card.id} className="deck-card-container relative group">
      <div className="relative">
        <img
          key={card.id}
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-full object-contain"
          draggable={false}
          loading="lazy"
        />
        
        {/* Preview ampliado al hacer hover */}
        <div className="fixed z-[9999] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
             style={{
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)',
               width: '300px',
               height: '420px'
             }}>
          <div className="bg-white rounded-lg shadow-2xl p-2">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-contain rounded"
              loading="lazy"
            />
          </div>
        </div>

        {/* Botón de eliminar (bote de basura) en overlay - visible al hacer hover o siempre accesible por teclado */}
        <div className={`absolute top-2 right-2 transition-opacity ${isDragging ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
          <Button
            variant="danger"
            size="sm"
            className="h-8 w-8 p-1"
            onClick={(e) => {
              // Evitar que el click dispare el drag o eventos parent
              e.stopPropagation();
              handleRemoveCard(card.id);
            }}
            aria-label={`Eliminar ${card.name} del mazo`}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* ...otros datos de la carta... */}
    </div>
  );

  // Validation, saving and card add/remove are handled by the useDeckEditor hook

  // Renderizar tarjeta para el catálogo
  const renderCardForCatalog = (card: CardDetails) => (
    <div 
      key={card.id} 
      className="relative group border rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleAddCard(card)}
    >
      <div className="relative aspect-[2.5/3.5] w-full">
        <Image
          src={card.imageUrl}
          alt={card.name}
          className="object-cover"
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />

        {/* Preview ampliado al hacer hover */}
        <div className="fixed z-[9999] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
             style={{
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)',
               width: '300px',
               height: '420px'
             }}>
          <div className="bg-white rounded-lg shadow-2xl p-2">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-contain rounded"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar tarjeta para el mazo
  const renderCardForDeck = (card: CardDetails, quantity: number) => (
    <div 
      key={card.id} 
      className="flex items-center border rounded-md p-2 mb-2 hover:bg-muted/30 cursor-pointer"
    >
      <div className="relative h-16 w-12 flex-shrink-0 mr-3">
        <Image
          src={card.imageUrl}
          alt={card.name}
          className="object-cover rounded-sm"
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-sm">{card.name}</h4>
        <div className="flex text-xs text-muted-foreground mt-1">
          <span className="mr-2">{card.cardType}</span>
          <span>{card.cardEnergy}</span>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="md"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveCard(card.id);
          }}
        >
          <Minus size={14} />
        </Button>
        <span className="w-6 text-center font-medium">1</span>
        <Button
          variant="outline"
          size="md"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleAddCard(card);
          }}
          disabled={true}
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );

  // Renderizar lista de cartas del mazo
  const renderDeckCardsList = () => {
    // Si no hay cartas, mostrar estado vacío
    if (deckCardOrder.length === 0) {
      return (
        <EmptyState
          title="No hay cartas en el mazo"
          description="Agrega cartas desde el catálogo"
          icon="cards"
        />
      );
    }

    // Obtener detalles de las cartas en el mazo usando el orden explícito
    const deckCardDetails = deckCardOrder
      .filter(cardId => deckCards[cardId]) // Solo cartas que aún están en el mazo
      .map(cardId => allCards.find(card => card.id === cardId))
      .filter(card => card !== undefined) as CardDetails[];

    return (
      <div className="space-y-2">
        {deckCardDetails.map(card => renderCardForDeck(card, deckCards[card.id]))}
      </div>
    );
  };

  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <EmptyState
        title="Acceso no autorizado"
        description="Debes iniciar sesión para editar mazos"
        icon="lock"
        action={
          <Button onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
        }
      />
    );
  }

  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Mensaje solo para mobile */}
      <div className="block md:hidden bg-yellow-100 text-yellow-800 text-center py-3 px-4 font-semibold border-b border-yellow-300">
        La creación de mazos solo está disponible en escritorio
      </div>
      {/* Cabecera (organism) */}
      <DeckEditorHeader
        navigate={navigate}
        deckName={deckName}
        setDeckName={setDeckName}
        nameError={nameError}
        setNameError={setNameError}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        isSaving={isSaving}
        handleSaveDeck={handleSaveDeck}
        setConfirmDeleteDialogOpen={setConfirmDeleteDialogOpen}
      />
      {/* Contenido principal - solo visible en escritorio */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Columna 1: Organizador de mazos */}
        <div className="w-[60%] overflow-y-auto">
          <div className="p-4">
            {renderDeckOrganizer()}
          </div>
        </div>
        {/* Catálogo (organism) */}
        <DeckEditorCatalog
          filteredCards={filteredCards}
          isLoadingCards={isLoadingCards}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedEnergy={selectedEnergy}
          setSelectedEnergy={setSelectedEnergy}
          typeOptions={typeOptions}
          energyOptions={energyOptions}
          renderCardForCatalog={renderCardForCatalog}
        />
      </div>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>¿Estás seguro de que quieres eliminar este mazo?</DialogTitle>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteDeck}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}