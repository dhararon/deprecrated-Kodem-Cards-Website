import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Card, CardDetails, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { Deck, DeckCardSlot } from '@/types/deck';
import { 
  getDeckById, 
  createDeck, 
  updateDeck, 
  checkDeckNameExists 
} from '@/lib/firebase/services/deckService';
import { 
  queryCards, 
  getCardsByIds 
} from '@/lib/firebase/services/cardService';
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, pointerWithin, rectIntersection, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

/**
 * Editor de Mazos - Componente para crear y editar mazos
 * @returns Componente React del editor de mazos
 */
export default function DeckEditor() {
  const [location, navigate] = useLocation();
  
  // Determinar si estamos creando un nuevo deck o editando uno existente
  const isNew = location.includes('/new');
  // Extraer el ID del último segmento de la URL, o vacío si no hay
  const urlSegments = location.split('/').filter(Boolean);
  const deckId = !isNew && urlSegments.length > 0 ? urlSegments[urlSegments.length - 1] : '';
  
  const { user } = useAuth();

  const MAX_ROT_CARDS = 5;
  const MAX_IXIM_CARDS = 5;
  const MAX_RAVA_CARDS = 2;
  const MAX_BIO_CARDS = 1;
  const MAX_PROTECTOR_CARDS = 2;

  // Estados para el mazo
  const [deck, setDeck] = useState<Deck | null>(null);
  const [deckName, setDeckName] = useState('Nuevo Mazo');
  const [deckDescription, setDeckDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para las cartas
  const [allCards, setAllCards] = useState<CardDetails[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardDetails[]>([]);
  const [deckCards, setDeckCards] = useState<Record<string, number>>({});
  const [deckCardOrder, setDeckCardOrder] = useState<string[]>([]); // Mantener orden de inserción
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customOrder, setCustomOrder] = useState<{
    protectors: string[];
    bio: string[];
    rot: string[];
    ixim: string[];
    adendeis: string[];
    others: string[];
  }>({
    protectors: [],
    bio: [],
    rot: [],
    ixim: [],
    adendeis: [],
    others: []
  });
  const [organizedDeck, setOrganizedDeck] = useState<{
    protector1?: CardDetails;
    mainAdendeis: CardDetails[];
    protector2?: CardDetails;
    bio?: CardDetails;
    rotCards: CardDetails[];
    iximCards: CardDetails[];
    otherCards: CardDetails[];
  }>({
    mainAdendeis: [],
    rotCards: [],
    iximCards: [],
    otherCards: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all_types');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('all_energies');
  const [selectedRarity, setSelectedRarity] = useState<string>('all_rarities');
  const [selectedSet, setSelectedSet] = useState<string>('all_sets');
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Validación y alertas
  const [nameError, setNameError] = useState('');
  
  // Memoized valores para selects
  const typeOptions = useMemo(() => Object.values(CardType), []);
  const energyOptions = useMemo(() => Object.values(CardEnergy), []);
  const rarityOptions = useMemo(() => Object.values(CardRarity), []);
  const setOptions = useMemo(() => Object.values(CardSet), []);

  // Total de cartas en el mazo
  const totalCards = useMemo(() => {
    return Object.values(deckCards).reduce((acc, qty) => acc + qty, 0);
  }, [deckCards]);

  // Estados para colapsar secciones
  const [showProtectorBio, setShowProtectorBio] = useState(true);
  const [showRot, setShowRot] = useState(true);
  const [showIxim, setShowIxim] = useState(true);

  // Verificar autenticación
  useEffect(() => {
    if (!user) {
      toast.error('Debes iniciar sesión para editar mazos');
      navigate('/login');
    }
  }, [user, navigate]);

  // Cargar cartas disponibles
  useEffect(() => {
    const loadCards = async () => {
      if (!user) return;
      
      setIsLoadingCards(true);
      try {
        const fetchedCards = await queryCards({});
        setAllCards(fetchedCards);
        setFilteredCards(fetchedCards);
      } catch (err) {
        console.error('Error al cargar cartas:', err);
        toast.error('Error al cargar las cartas disponibles');
      } finally {
        setIsLoadingCards(false);
      }
    };
    
    loadCards();
  }, [user]);

  // Cargar mazo existente cuando se está editando
  useEffect(() => {
    if (!user || isNew || !deckId) return;
    
    const loadExistingDeck = async () => {
      setIsLoading(true);
      try {
        const existingDeck = await getDeckById(deckId);
        if (!existingDeck) {
          toast.error('No se encontró el mazo solicitado');
          navigate('/decks');
          return;
        }
        
        // Verificar que el mazo pertenece al usuario
        if (existingDeck.userUid !== user.id) {
          toast.error('No tienes permiso para editar este mazo');
          navigate('/decks');
          return;
        }
        
        // Establecer los datos del mazo
        setDeck(existingDeck);
        setDeckName(existingDeck.name);
        setDeckDescription(existingDeck.description || '');
        setIsPublic(existingDeck.isPublic);
        
        // Cargar las cartas del mazo
        if (existingDeck.deckSlots && existingDeck.deckSlots.length > 0 && allCards.length > 0) {
          // Establecer deckCards con los conteos y el orden
          const cardCounts: Record<string, number> = {};
          const cardOrder: string[] = [];
          
          existingDeck.deckSlots.forEach(slot => {
            cardCounts[slot.cardId] = (cardCounts[slot.cardId] || 0) + 1;
            // Solo agregar al orden la primera vez que aparece
            if (!cardOrder.includes(slot.cardId)) {
              cardOrder.push(slot.cardId);
            }
          });
          
          // Establecer deckCards con los conteos y el orden
          setDeckCards(cardCounts);
          setDeckCardOrder(cardOrder);
          
          // Inicializar customOrder basado en las cartas existentes
          const initialCustomOrder = {
            protectors: [] as string[],
            bio: [] as string[],
            rot: [] as string[],
            ixim: [] as string[],
            adendeis: [] as string[],
            others: [] as string[]
          };
          
          cardOrder.forEach(cardId => {
            const card = allCards.find(c => c.id === cardId);
            if (!card) return;
            
            switch (card.cardType) {
              case CardType.PROTECTOR:
                if (!initialCustomOrder.protectors.includes(cardId)) {
                  initialCustomOrder.protectors.push(cardId);
                }
                break;
              case CardType.BIO:
                if (!initialCustomOrder.bio.includes(cardId)) {
                  initialCustomOrder.bio.push(cardId);
                }
                break;
              case CardType.ROT:
                if (!initialCustomOrder.rot.includes(cardId)) {
                  initialCustomOrder.rot.push(cardId);
                }
                break;
              case CardType.IXIM:
                if (!initialCustomOrder.ixim.includes(cardId)) {
                  initialCustomOrder.ixim.push(cardId);
                }
                break;
              case CardType.ADENDEI:
              case CardType.ADENDEI_TITAN:
              case CardType.ADENDEI_GUARDIAN:
              case CardType.ADENDEI_CATRIN:
              case CardType.ADENDEI_KOSMICO:
              case CardType.ADENDEI_EQUINO:
              case CardType.ADENDEI_ABISMAL:
              case CardType.ADENDEI_INFECTADO:
              case CardType.RAVA:
                if (!initialCustomOrder.adendeis.includes(cardId)) {
                  initialCustomOrder.adendeis.push(cardId);
                }
                break;
              default:
                if (!initialCustomOrder.others.includes(cardId)) {
                  initialCustomOrder.others.push(cardId);
                }
                break;
            }
          });
          
          setCustomOrder(initialCustomOrder);
        }
      } catch (err) {
        console.error('Error al cargar mazo:', err);
        toast.error('Error al cargar el mazo');
        navigate('/decks');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (allCards.length > 0) {
      loadExistingDeck();
    }
  }, [user, isNew, deckId, navigate, allCards]);

  // Categorizar cartas por tipo para el organizador
  useEffect(() => {
    if (allCards.length === 0) return;
    
    // Función helper para obtener cartas en el orden personalizado
    const getCardsInCustomOrder = (cardIds: string[], cardType: CardType | CardType[]) => {
      return cardIds
        .filter(cardId => deckCards[cardId]) // Solo cartas que aún están en el mazo
        .map(cardId => allCards.find(card => card.id === cardId))
        .filter(card => {
          if (!card) return false;
          if (Array.isArray(cardType)) {
            return cardType.includes(card.cardType);
          }
          return card.cardType === cardType;
        }) as CardDetails[];
    };

    // Obtener cartas en orden personalizado
    const protectors = getCardsInCustomOrder(customOrder.protectors, CardType.PROTECTOR);
    const bioCards = getCardsInCustomOrder(customOrder.bio, CardType.BIO);
    const rotCards = getCardsInCustomOrder(customOrder.rot, CardType.ROT);
    const iximCards = getCardsInCustomOrder(customOrder.ixim, CardType.IXIM);
    const adendeiCards = getCardsInCustomOrder(customOrder.adendeis, [
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
    ]);
    const otherCards = getCardsInCustomOrder(customOrder.others, [] as CardType[]);
    
    // Si hay cartas nuevas que no están en customOrder, agregarlas al final
    const allDeckCardDetails = deckCardOrder
      .filter(cardId => deckCards[cardId])
      .map(cardId => allCards.find(card => card.id === cardId))
      .filter(card => card !== undefined) as CardDetails[];
    
    // Verificar si hay cartas no organizadas y agregarlas al orden correspondiente
    const unorganizedCards = allDeckCardDetails.filter(card => {
      const isInCustomOrder = 
        customOrder.protectors.includes(card.id) ||
        customOrder.bio.includes(card.id) ||
        customOrder.rot.includes(card.id) ||
        customOrder.ixim.includes(card.id) ||
        customOrder.adendeis.includes(card.id) ||
        customOrder.others.includes(card.id);
      return !isInCustomOrder;
    });
    
    if (unorganizedCards.length > 0) {
      setCustomOrder(prev => {
        const newOrder = { ...prev };
        
        unorganizedCards.forEach(card => {
          switch (card.cardType) {
            case CardType.PROTECTOR:
              if (!newOrder.protectors.includes(card.id)) {
                newOrder.protectors = [...newOrder.protectors, card.id];
              }
              break;
            case CardType.BIO:
              if (!newOrder.bio.includes(card.id)) {
                newOrder.bio = [...newOrder.bio, card.id];
              }
              break;
            case CardType.ROT:
              if (!newOrder.rot.includes(card.id)) {
                newOrder.rot = [...newOrder.rot, card.id];
              }
              break;
            case CardType.IXIM:
              if (!newOrder.ixim.includes(card.id)) {
                newOrder.ixim = [...newOrder.ixim, card.id];
              }
              break;
            case CardType.ADENDEI:
            case CardType.ADENDEI_TITAN:
            case CardType.ADENDEI_GUARDIAN:
            case CardType.ADENDEI_CATRIN:
            case CardType.ADENDEI_KOSMICO:
            case CardType.ADENDEI_EQUINO:
            case CardType.ADENDEI_ABISMAL:
            case CardType.ADENDEI_INFECTADO:
            case CardType.RAVA:
              if (!newOrder.adendeis.includes(card.id)) {
                newOrder.adendeis = [...newOrder.adendeis, card.id];
              }
              break;
            default:
              if (!newOrder.others.includes(card.id)) {
                newOrder.others = [...newOrder.others, card.id];
              }
              break;
          }
        });
        
        return newOrder;
      });
      return; // Salir temprano, el useEffect se ejecutará de nuevo con customOrder actualizado
    }
    
    // Organizar cartas respetando el orden personalizado
    const organizedProtectors = protectors.slice(0, 2);
    const organizedBio = bioCards.slice(0, 1);
    const organizedRot = rotCards.slice(0, 5);
    const organizedIxim = iximCards.slice(0, 5);
    const allAdendeis = adendeiCards.slice(0, 24);
    
    // Cartas adicionales que exceden los límites
    const additionalCards = [
      ...protectors.slice(2),
      ...bioCards.slice(1),
      ...rotCards.slice(5),
      ...iximCards.slice(5),
      ...adendeiCards.slice(24),
      ...otherCards
    ];
    
    setOrganizedDeck({
      protector1: organizedProtectors[0] || undefined,
      protector2: organizedProtectors[1] || undefined,
      bio: organizedBio[0] || undefined,
      mainAdendeis: allAdendeis,
      rotCards: organizedRot,
      iximCards: organizedIxim,
      otherCards: additionalCards
    });
  }, [allCards, deckCards, customOrder]);

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

  // Función para validar las reglas del deck
  const validateDeckRules = (currentDeckCards: Record<string, number>, newCard?: CardDetails): { isValid: boolean; error?: string } => {
    // Obtener detalles de las cartas actuales en el mazo
    const currentCardIds = Object.keys(currentDeckCards);
    const currentCardDetails = allCards.filter(card => currentCardIds.includes(card.id));
    
    // Si estamos validando para agregar una nueva carta, incluirla temporalmente
    let cardsToValidate = currentCardDetails;
    if (newCard) {
      cardsToValidate = [...currentCardDetails, newCard];
    }
    
    // Contar cartas por tipo
    let rotCount = 0;
    let iximCount = 0;
    let ravaCount = 0;
    let bioCount = 0;
    let protectorCount = 0;
    let adendeiCount = 0;
    
    // Map para contar nombres únicos
    const nameCount = new Map<string, number>();
    
    cardsToValidate.forEach(card => {
      const cardId = card.id;
      const quantity = currentDeckCards[cardId] || (newCard && newCard.id === cardId ? 1 : 0);
      
      // Contar nombres únicos (en minúsculas)
      const normalizedName = card.name.toLowerCase();
      nameCount.set(normalizedName, (nameCount.get(normalizedName) || 0) + quantity);
      
      // Contar por tipo
      switch (card.cardType) {
        case CardType.ROT:
          rotCount += quantity;
          break;
        case CardType.IXIM:
          iximCount += quantity;
          break;
        case CardType.RAVA:
          ravaCount += quantity;
          break;
        case CardType.BIO:
          bioCount += quantity;
          break;
        case CardType.PROTECTOR:
          protectorCount += quantity;
          break;
        case CardType.ADENDEI:
        case CardType.ADENDEI_TITAN:
        case CardType.ADENDEI_GUARDIAN:
        case CardType.ADENDEI_CATRIN:
        case CardType.ADENDEI_KOSMICO:
        case CardType.ADENDEI_EQUINO:
        case CardType.ADENDEI_ABISMAL:
        case CardType.ADENDEI_INFECTADO:
        case CardType.ADENDEI_GUARDIAN_CATRIN:
        case CardType.ADENDEI_RESURRECTO:
          adendeiCount += quantity;
          break;
      }
    });
    
    // Validar nombres únicos
    for (const [name, count] of nameCount.entries()) {
      if (count > 1) {
        return { isValid: false, error: `Solo puede existir 1 carta con el nombre "${name}" en el mazo` };
      }
    }
    
    // Validar límites por tipo
    if (rotCount > MAX_ROT_CARDS) {
      return { isValid: false, error: `Máximo 4 cartas Rot permitidas (tienes ${rotCount})` };
    }
    
    if (iximCount > MAX_IXIM_CARDS) {
      return { isValid: false, error: `Máximo 4 cartas Ixim permitidas (tienes ${iximCount})` };
    }
    
    if (ravaCount > MAX_RAVA_CARDS) {
      return { isValid: false, error: `Máximo 1 carta Rava permitida (tienes ${ravaCount})` };
    }
    
    if (bioCount > MAX_BIO_CARDS) {
      return { isValid: false, error: `Máximo 1 carta Bio permitida (tienes ${bioCount})` };
    }
    
    if (protectorCount > MAX_PROTECTOR_CARDS) {
      return { isValid: false, error: `Máximo 2 Protectores permitidos (tienes ${protectorCount})` };
    }
    
    if (adendeiCount > 24) {
      return { isValid: false, error: `Máximo 24 Adendeis permitidos (tienes ${adendeiCount})` };
    }
    
    return { isValid: true };
  };

  // Función para validar deck completo antes de guardar
  const validateCompleteDeck = (deckCards: Record<string, number>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Obtener detalles de las cartas en el mazo
    const cardIds = Object.keys(deckCards);
    const cardDetails = allCards.filter(card => cardIds.includes(card.id));
    
    // Contar cartas por tipo
    let rotCount = 0;
    let iximCount = 0;
    let ravaCount = 0;
    let bioCount = 0;
    let protectorCount = 0;
    let adendeiCount = 0;
    
    cardDetails.forEach(card => {
      const quantity = deckCards[card.id];
      
      switch (card.cardType) {
        case CardType.ROT:
          rotCount += quantity;
          break;
        case CardType.IXIM:
          iximCount += quantity;
          break;
        case CardType.RAVA:
          ravaCount += quantity;
          break;
        case CardType.BIO:
          bioCount += quantity;
          break;
        case CardType.PROTECTOR:
          protectorCount += quantity;
          break;
        case CardType.ADENDEI:
        case CardType.ADENDEI_TITAN:
        case CardType.ADENDEI_GUARDIAN:
        case CardType.ADENDEI_CATRIN:
        case CardType.ADENDEI_KOSMICO:
        case CardType.ADENDEI_EQUINO:
        case CardType.ADENDEI_ABISMAL:
        case CardType.ADENDEI_INFECTADO:
        case CardType.ADENDEI_GUARDIAN_CATRIN:
        case CardType.ADENDEI_RESURRECTO:
          adendeiCount += quantity;
          break;
      }
    });
    
    // Validar mínimos requeridos
    if (protectorCount < 1) {
      errors.push('Se requiere al menos 1 Protector');
    }
    
    if (adendeiCount < 15) {
      errors.push(`Se requieren al menos 15 Adendeis (tienes ${adendeiCount})`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Guardar el mazo
  const handleSaveDeck = async () => {
    // Validaciones
    if (!deckName.trim()) {
      setNameError('El nombre del mazo es obligatorio');
      return;
    }
    
    if (totalCards === 0) {
      toast.error('Debes agregar al menos una carta al mazo');
      return;
    }

    // Validar reglas del deck completo
    const deckValidation = validateCompleteDeck(deckCards);
    if (!deckValidation.isValid) {
      deckValidation.errors.forEach(error => toast.error(error));
      return;
    }
    
    // Comprobar si el nombre ya existe
    try {
      const nameExists = await checkDeckNameExists(
        user!.id, 
        deckName.trim(), 
        deckId || undefined
      );
      
      if (nameExists.exists) {
        setNameError('Ya tienes un mazo con este nombre');
        return;
      }
    } catch (error) {
      console.error('Error al verificar nombre:', error);
      toast.error('Error al verificar el nombre del mazo');
      return;
    }
    
    setIsSaving(true);
    try {
      // Construir deckSlots recorriendo el grid visual (mainAdendeis, protectores, bio, rot, ixim, others)
      const deckSlots: DeckCardSlot[] = [];
      let currentRow = 0;
      let currentCol = 0;
      const maxCols = 3;

      // Helper para agregar cartas a slots
      const addCardsToSlots = (cards: CardDetails[]) => {
        cards.forEach(card => {
          deckSlots.push({ cardId: card.id, row: currentRow, col: currentCol });
          currentCol++;
          if (currentCol >= maxCols) {
            currentCol = 0;
            currentRow++;
          }
        });
      };

      // Agregar protectores, bio, rot, ixim, adendeis, others en orden visual
      if (organizedDeck.protector1) addCardsToSlots([organizedDeck.protector1]);
      if (organizedDeck.protector2) addCardsToSlots([organizedDeck.protector2]);
      if (organizedDeck.bio) addCardsToSlots([organizedDeck.bio]);
      addCardsToSlots(organizedDeck.rotCards);
      addCardsToSlots(organizedDeck.iximCards);
      addCardsToSlots(organizedDeck.mainAdendeis);
      addCardsToSlots(organizedDeck.otherCards);

      // Guardar el mazo con deckSlots
      // Nuevo: generar cardIds a partir de deckSlots
      const cardIds = deckSlots.map(slot => slot.cardId);
      const deckData: Omit<Deck, 'id'> & { deckSlots: DeckCardSlot[] } = {
        name: deckName.trim(),
        userUid: user!.id,
        userName: user!.name || 'Usuario',
        userAvatar: user!.avatarUrl || undefined,
        isPublic,
        description: deckDescription.trim() || "",
        cardIds, // Ahora siempre sincronizado con deckSlots
        deckSlots // Nuevo campo
      };

      let newDeckId;
      if (deckId && !isNew) {
        try {
          await updateDeck(deckId, {
            name: deckData.name,
            deckSlots: deckData.deckSlots,
            isPublic: deckData.isPublic,
            description: deckData.description
          });
          newDeckId = deckId;
          toast.success('Mazo actualizado correctamente');
        } catch (error) {
          console.error('Error al actualizar, creando nuevo mazo:', error);
          newDeckId = await createDeck(deckData);
          toast.success('No se pudo actualizar, se ha creado un nuevo mazo');
        }
      } else {
        newDeckId = await createDeck(deckData);
        toast.success('Mazo creado correctamente');
      }
      navigate(`/decks/${newDeckId}`);
    } catch (error) {
      console.error('Error al guardar el mazo:', error);
      toast.error('Error al guardar el mazo');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar cartas basado en los filtros seleccionados
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoadingCards(true);
      try {
        // Construir filtros para la query
        const filters: any = {
          searchTerm: searchTerm || undefined,
        };

        if (selectedType !== 'all_types') {
          filters.type = selectedType as CardType;
        }

        if (selectedEnergy !== 'all_energies') {
          filters.energy = selectedEnergy as CardEnergy;
        }

        if (selectedRarity !== 'all_rarities') {
          filters.rarity = selectedRarity as CardRarity;
        }

        if (selectedSet !== 'all_sets') {
          filters.set = selectedSet as CardSet;
        }

        // Si no hay filtros, mostrar todas las cartas
        if (Object.keys(filters).length === 0) {
          setFilteredCards(allCards);
        } else {
          // Obtener cartas con filtros
          const filteredResults = await queryCards(filters);
          setFilteredCards(filteredResults);
        }
      } catch (error) {
        console.error('Error al filtrar cartas:', error);
        toast.error('Error al filtrar las cartas');
      } finally {
        setIsLoadingCards(false);
      }
    };

    // Aplicar filtros si ya se cargaron todas las cartas
    if (allCards.length > 0) {
      applyFilters();
    }
  }, [allCards, searchTerm, selectedType, selectedEnergy, selectedRarity, selectedSet]);

  // Eliminar el mazo
  const handleDeleteDeck = async () => {
    if (!deckId || isNew) {
      toast.error('No se puede eliminar un mazo que no ha sido guardado');
      return;
    }
    
    setIsLoading(true);
    try {
      // Solo intentamos eliminar si tenemos un ID válido
      try {
        await import('@/lib/firebase/services/deckService').then(module => {
          return module.deleteDeck(deckId);
        });
        toast.success('Mazo eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el mazo:', error);
        toast.error('Error al eliminar el mazo');
      }
      
      // Redireccionar al listado de mazos
      navigate('/decks');
    } catch (error) {
      console.error('Error al procesar la eliminación:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
      setConfirmDeleteDialogOpen(false);
    }
  };

  // Agregar carta al mazo
  const handleAddCard = (card: CardDetails) => {
    // Bloquear agregar tokens
    if (card.cardType === CardType.TOKEN) {
      toast.warning('No se pueden agregar cartas de tipo Token al mazo');
      return;
    }

    // Validar reglas del deck antes de agregar
    const validation = validateDeckRules(deckCards, card);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Verificar si la carta ya está en el deck (validación de nombre único)
    const existingCard = deckCardOrder.find(cardId => {
      const existingCardDetails = allCards.find(c => c.id === cardId);
      return existingCardDetails && existingCardDetails.name.toLowerCase() === card.name.toLowerCase();
    });

    if (existingCard) {
      toast.warning(`Ya existe una carta con el nombre "${card.name}" en el mazo`);
      return;
    }

    // Agregar la carta al mazo y al final del orden
    setDeckCards(prev => ({
      ...prev,
      [card.id]: 1
    }));

    // Agregar al final del orden de inserción
    setDeckCardOrder(prev => [...prev, card.id]);

    // Actualizar customOrder según el tipo de carta
    setCustomOrder(prev => {
      const newOrder = { ...prev };
      
      switch (card.cardType) {
        case CardType.PROTECTOR:
          if (!newOrder.protectors.includes(card.id)) {
            newOrder.protectors = [...newOrder.protectors, card.id];
          }
          break;
        case CardType.BIO:
          if (!newOrder.bio.includes(card.id)) {
            newOrder.bio = [...newOrder.bio, card.id];
          }
          break;
        case CardType.ROT:
          if (!newOrder.rot.includes(card.id)) {
            newOrder.rot = [...newOrder.rot, card.id];
          }
          break;
        case CardType.IXIM:
          if (!newOrder.ixim.includes(card.id)) {
            newOrder.ixim = [...newOrder.ixim, card.id];
          }
          break;
        case CardType.ADENDEI:
        case CardType.ADENDEI_TITAN:
        case CardType.ADENDEI_GUARDIAN:
        case CardType.ADENDEI_CATRIN:
        case CardType.ADENDEI_KOSMICO:
        case CardType.ADENDEI_EQUINO:
        case CardType.ADENDEI_ABISMAL:
        case CardType.ADENDEI_INFECTADO:
        case CardType.RAVA:
        case CardType.ADENDEI_RESURRECTO:
        case CardType.ADENDEI_GUARDIAN_CATRIN:
          if (!newOrder.adendeis.includes(card.id)) {
            newOrder.adendeis = [...newOrder.adendeis, card.id];
          }
          break;
        default:
          if (!newOrder.others.includes(card.id)) {
            newOrder.others = [...newOrder.others, card.id];
          }
          break;
      }
      
      return newOrder;
    });

    toast.success(`${card.name} agregada al mazo`);
  };

  // Quitar carta del mazo
  const handleRemoveCard = (cardId: string) => {
    const removedCard = allCards.find(card => card.id === cardId);
    
    setDeckCards(prev => {
      const newDeckCards = { ...prev };
      delete newDeckCards[cardId];
      return newDeckCards;
    });

    // Remover del orden de inserción
    setDeckCardOrder(prev => prev.filter(id => id !== cardId));

    // Remover de customOrder
    setCustomOrder(prev => ({
      protectors: prev.protectors.filter(id => id !== cardId),
      bio: prev.bio.filter(id => id !== cardId),
      rot: prev.rot.filter(id => id !== cardId),
      ixim: prev.ixim.filter(id => id !== cardId),
      adendeis: prev.adendeis.filter(id => id !== cardId),
      others: prev.others.filter(id => id !== cardId)
    }));

    // Mostrar mensaje de confirmación
    if (removedCard) {
      toast.success(`${removedCard.name} eliminada del mazo`);
    }
  };

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
      {/* Cabecera solo visible en escritorio */}
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
            {isPublic ? 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg> : 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock text-red-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            }
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
              <Save size={16} className="mr-1" />
            )}
            Guardar
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
            Compartir
          </Button>
        </div>
      </div>
      {/* Contenido principal - solo visible en escritorio */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Columna 1: Organizador de mazos */}
        <div className="w-[60%] overflow-y-auto">
          <div className="p-4">
            {renderDeckOrganizer()}
          </div>
        </div>
        {/* Columna 2: Catálogo de cartas */}
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

