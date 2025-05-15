import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Card, CardDetails, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { Deck } from '@/types/deck';
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
import { Search, Plus, Minus, Save, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/Dialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, pointerWithin, rectIntersection } from '@dnd-kit/core';
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  // Categorizar cartas por tipo para el organizador
  useEffect(() => {
    if (allCards.length === 0) return;
    
    // Obtener las cartas que están en el mazo
    const deckCardIds = Object.keys(deckCards);
    const deckCardDetails = allCards.filter(card => deckCardIds.includes(card.id));
    
    // Organizar las cartas por tipo
    const protectors = deckCardDetails.filter(card => card.cardType === CardType.PROTECTOR);
    const adendeis = deckCardDetails.filter(card => 
      card.cardType === CardType.ADENDEI || 
      card.cardType === CardType.ADENDEI_TITAN || 
      card.cardType === CardType.ADENDEI_GUARDIAN || 
      card.cardType === CardType.ADENDEI_CATRIN || 
      card.cardType === CardType.ADENDEI_KOSMICO || 
      card.cardType === CardType.ADENDEI_EQUINO || 
      card.cardType === CardType.ADENDEI_ABISMAL || 
      card.cardType === CardType.ADENDEI_INFECTADO ||
      card.cardType === CardType.RAVA  // Tratar Rava como Adendei
    );
    const rotCards = deckCardDetails.filter(card => card.cardType === CardType.ROT);
    const iximCards = deckCardDetails.filter(card => card.cardType === CardType.IXIM);
    const bioCards = deckCardDetails.filter(card => card.cardType === CardType.BIO);
    
    // Organizarlas según la estructura requerida - simplemente usar adendeis (que ya incluye ravas)
    setOrganizedDeck({
      protector1: protectors.length > 0 ? protectors[0] : undefined,
      mainAdendeis: adendeis.slice(0, 3), // Los primeros 3 adendeis/ravas
      protector2: protectors.length > 1 ? protectors[1] : undefined,
      bio: bioCards.length > 0 ? bioCards[0] : undefined,
      rotCards: rotCards.slice(0, 4), // Hasta 4 cartas rot para fila 3
      iximCards: iximCards.slice(0, 4), // Hasta 4 cartas ixim para fila 4
      otherCards: [
        ...adendeis.slice(3), // Adendeis/Ravas restantes
        ...protectors.slice(2), // Protectores adicionales
        ...bioCards.slice(1), // Bios adicionales
        ...rotCards.slice(4), // Rot adicionales
        ...iximCards.slice(4), // Ixim adicionales
        ...deckCardDetails.filter(card => 
          !(card.cardType === CardType.PROTECTOR || 
            card.cardType === CardType.ADENDEI || 
            card.cardType === CardType.ADENDEI_TITAN || 
            card.cardType === CardType.ADENDEI_GUARDIAN || 
            card.cardType === CardType.ADENDEI_CATRIN || 
            card.cardType === CardType.ADENDEI_KOSMICO || 
            card.cardType === CardType.ADENDEI_EQUINO || 
            card.cardType === CardType.ADENDEI_ABISMAL || 
            card.cardType === CardType.ADENDEI_INFECTADO || 
            card.cardType === CardType.RAVA ||  // Incluir Rava en la lista de exclusión
            card.cardType === CardType.ROT || 
            card.cardType === CardType.IXIM || 
            card.cardType === CardType.BIO)
        )
      ]
    });
  }, [allCards, deckCards]);

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

    if (active.id !== over.id) {
      const [activeSection, activeIndexStr] = String(active.id).split('-');
      const [overSection, overIndexStr] = String(over.id).split('-');
      const activeIndex = parseInt(activeIndexStr);
      const overIndex = parseInt(overIndexStr);

      // Reordenar dentro de la misma sección
      if (activeSection === overSection) {
        setOrganizedDeck(prev => {
          const newDeck = { ...prev };
          switch (activeSection) {
            case 'mainAdendei':
              newDeck.mainAdendeis = arrayMove(prev.mainAdendeis, activeIndex, overIndex);
              break;
            case 'rot':
              newDeck.rotCards = arrayMove(prev.rotCards, activeIndex, overIndex);
              break;
            case 'ixim':
              newDeck.iximCards = arrayMove(prev.iximCards, activeIndex, overIndex);
              break;
            case 'other':
              newDeck.otherCards = arrayMove(prev.otherCards, activeIndex, overIndex);
              break;
          }
          return newDeck;
        });
      } else if (
        (activeSection === 'mainAdendei' && overSection === 'other') ||
        (activeSection === 'other' && overSection === 'mainAdendei')
      ) {
        setOrganizedDeck(prev => {
          const newDeck = { ...prev };
          if (activeSection === 'mainAdendei' && overSection === 'other') {
            const cardToMove = prev.mainAdendeis[activeIndex];
            if (!adendeiTypes.includes(cardToMove.cardType)) {
              toast.warning('Solo puedes mover Adendeis o Rava a la sección de Adendeis y Rava adicionales');
              return prev;
            }
            const targetCard = prev.otherCards[overIndex];
            if (targetCard) {
              if (!adendeiTypes.includes(targetCard.cardType)) {
                toast.warning('Solo puedes poner Adendeis o Rava en los slots principales');
                return prev;
              }
              // Validar máximo 1 Rava en principales
              const mainAdendeisAfterSwap = [...prev.mainAdendeis];
              mainAdendeisAfterSwap[activeIndex] = targetCard;
              const ravaCount = mainAdendeisAfterSwap.filter(card => card.cardType === CardType.RAVA).length;
              if (ravaCount > 1) {
                toast.error('Solo puede existir 1 carta Rava por mazo');
                return prev;
              }
              newDeck.mainAdendeis[activeIndex] = targetCard;
              newDeck.otherCards = [...prev.otherCards];
              newDeck.otherCards[overIndex] = cardToMove;
            } else {
              // Mover a slot vacío
              if (newDeck.mainAdendeis.length <= 1) {
                toast.error('Debes tener al menos 1 adendei principal');
                return prev;
              }
              newDeck.mainAdendeis = [
                ...prev.mainAdendeis.slice(0, activeIndex),
                ...prev.mainAdendeis.slice(activeIndex + 1)
              ];
              newDeck.otherCards.splice(overIndex, 0, cardToMove);
            }
          } else if (activeSection === 'other' && overSection === 'mainAdendei') {
            const cardToMove = prev.otherCards[activeIndex];
            if (!adendeiTypes.includes(cardToMove.cardType)) {
              toast.warning('Solo puedes mover Adendeis o Rava entre estas secciones');
              return prev;
            }
            const targetCard = prev.mainAdendeis[overIndex];
            if (targetCard) {
              if (!adendeiTypes.includes(targetCard.cardType)) {
                toast.warning('Solo puedes poner Adendeis o Rava en los slots principales');
                return prev;
              }
              // Validar máximo 1 Rava en principales
              const mainAdendeisAfterSwap = [...prev.mainAdendeis];
              mainAdendeisAfterSwap[overIndex] = cardToMove;
              const ravaCount = mainAdendeisAfterSwap.filter(card => card.cardType === CardType.RAVA).length;
              if (ravaCount > 1) {
                toast.error('Solo puede existir 1 carta Rava por mazo');
                return prev;
              }
              newDeck.otherCards = [...prev.otherCards];
              newDeck.otherCards[activeIndex] = targetCard;
              newDeck.mainAdendeis[overIndex] = cardToMove;
            } else {
              // Mover a slot vacío
              if (newDeck.mainAdendeis.length >= 3) {
                toast.error('Solo puedes tener 3 adendeis principales');
                return prev;
              }
              if (cardToMove.cardType === CardType.RAVA) {
                const hasRava = newDeck.mainAdendeis.some(card => card.cardType === CardType.RAVA);
                if (hasRava) {
                  toast.error('Solo puede existir 1 carta Rava por mazo');
                  return prev;
                }
              }
              newDeck.otherCards = [
                ...prev.otherCards.slice(0, activeIndex),
                ...prev.otherCards.slice(activeIndex + 1)
              ];
              newDeck.mainAdendeis.push(cardToMove);
            }
          }
          return newDeck;
        });
      }
    }
  };

  // Renderizar el organizador
  const renderDeckOrganizer = () => {
    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Fila 1: Protector y adendeis principales */}
          <div>
            <h3 className="font-medium text-sm mb-2">Protector y Adendeis Principales</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container">
                {organizedDeck.protector1 ? (
                  <div 
                    data-id="protector1-0"
                    className="w-full h-full cursor-grab active:cursor-grabbing touch-manipulation"
                  >
                    {renderDeckCard(organizedDeck.protector1)}
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    <div className="mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    </div>
                    Protector 1
                  </div>
                )}
              </div>
              <SortableContext 
                items={organizedDeck.mainAdendeis.map((_, i) => `mainAdendei-${i}`)} 
                strategy={horizontalListSortingStrategy}
              >
                {Array(3).fill(null).map((_, idx) => (
                  <div key={`main-adendei-${idx}`} className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container" 
                       data-droppable-id={`mainAdendei-${idx}`}>
                    {organizedDeck.mainAdendeis[idx] ? (
                      <SortableCard 
                        card={organizedDeck.mainAdendeis[idx]} 
                        id={`mainAdendei-${idx}`} 
                      />
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        <div className="mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                        </div>
                        Adendei Principal {idx + 1}
                      </div>
                    )}
                  </div>
                ))}
              </SortableContext>
            </div>
          </div>
          {/* Fila 2: Protector Secundario y Bio */}
          <div>
            <button
              type="button"
              className="flex items-center w-full mb-2 text-sm font-medium focus:outline-none"
              onClick={() => setShowProtectorBio((v) => !v)}
              aria-expanded={showProtectorBio}
            >
              {showProtectorBio ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Protector Secundario y Bio
            </button>
            {showProtectorBio && (
              <div className="grid grid-cols-4 gap-3">
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container">
                  {organizedDeck.protector2 ? (
                    <div 
                      data-id="protector2-0"
                      className="w-full h-full cursor-grab active:cursor-grabbing touch-manipulation"
                    >
                      {renderDeckCard(organizedDeck.protector2)}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground">
                      <div className="mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                      </div>
                      Protector 2
                    </div>
                  )}
                </div>
                <div className="col-span-3 border-2 border-dashed border-muted-foreground/20 rounded-md p-2 flex items-center justify-center card-container">
                  {organizedDeck.bio ? (
                    <div 
                      data-id="bio-0"
                      className={
                        organizedDeck.bio.cardType === CardType.BIO
                          ? "aspect-[3.5/2.5] w-[300px] mx-auto cursor-grab active:cursor-grabbing touch-manipulation"
                          : "aspect-[2.5/3.5] w-[220px] mx-auto cursor-grab active:cursor-grabbing touch-manipulation"
                      }
                    >
                      {renderDeckCard(organizedDeck.bio)}
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
            )}
          </div>
          {/* Fila 3: Cartas Rot */}
          <div>
            <button
              type="button"
              className="flex items-center w-full mb-2 text-sm font-medium focus:outline-none"
              onClick={() => setShowRot((v) => !v)}
              aria-expanded={showRot}
            >
              {showRot ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Cartas Rot
            </button>
            {showRot && (
              <div className="grid grid-cols-4 gap-3">
                <SortableContext items={organizedDeck.rotCards.map((_, i) => `rot-${i}`)} strategy={horizontalListSortingStrategy}>
                  {Array(4).fill(null).map((_, idx) => (
                    <div key={`rot-${idx}`} className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container"
                         data-droppable-id={`rot-${idx}}`}>
                      {organizedDeck.rotCards[idx] ? (
                        <SortableCard 
                          card={organizedDeck.rotCards[idx]} 
                          id={`rot-${idx}`} 
                        />
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
                </SortableContext>
              </div>
            )}
          </div>
          {/* Fila 4: Cartas Ixim */}
          <div>
            <button
              type="button"
              className="flex items-center w-full mb-2 text-sm font-medium focus:outline-none"
              onClick={() => setShowIxim((v) => !v)}
              aria-expanded={showIxim}
            >
              {showIxim ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Cartas Ixim
            </button>
            {showIxim && (
              <div className="grid grid-cols-4 gap-3">
                <SortableContext items={organizedDeck.iximCards.map((_, i) => `ixim-${i}`)} strategy={horizontalListSortingStrategy}>
                  {Array(4).fill(null).map((_, idx) => (
                    <div key={`ixim-${idx}`} className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container"
                         data-droppable-id={`ixim-${idx}`}> 
                      {organizedDeck.iximCards[idx] ? (
                        <SortableCard 
                          card={organizedDeck.iximCards[idx]} 
                          id={`ixim-${idx}`} 
                        />
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
                </SortableContext>
              </div>
            )}
          </div>
          {/* Fila 5+: Otras cartas (3 columnas) - Siempre mostrar al menos una fila vacía */}
          <div>
            <h3 className="font-medium text-sm mb-2">Adendeis y Rava adicionales</h3>
            <div className="grid grid-cols-3 gap-3">
              {organizedDeck.otherCards.length > 0 ? (
                <SortableContext items={organizedDeck.otherCards.map((_, i) => `other-${i}`)} strategy={horizontalListSortingStrategy}>
                  {organizedDeck.otherCards.map((card, idx) => (
                    <div key={`other-${idx}`} className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container"
                         data-droppable-id={`other-${idx}`}>
                      <SortableCard 
                        card={card} 
                        id={`other-${idx}`} 
                      />
                    </div>
                  ))}
                </SortableContext>
              ) : (
                // Mostrar al menos una fila vacía para adendeis y rava adicionales
                Array(3).fill(null).map((_, idx) => (
                  <div key={`other-empty-${idx}`} className="border-2 border-dashed border-muted-foreground/20 rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container">
                    <div className="text-center text-sm text-muted-foreground">
                      <div className="mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                      </div>
                      Adendei/Rava Adicional
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DndContext>
    );
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
      opacity: isDragging ? 0.6 : 1,
      zIndex: isDragging ? 999 : 1,
      boxShadow: isDragging ? '0 8px 20px rgba(0, 0, 0, 0.2)' : 'none',
      touchAction: 'none',
      width: '157px',
      height: '220px',
    };
    
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className={`cursor-grab active:cursor-grabbing touch-manipulation ${isDragging ? 'scale-105' : ''}`}
        data-id={id}
        data-state={isDragging ? 'dragging' : 'idle'}
      >
        {renderDeckCard(card)}
      </div>
    );
  };

  // Renderizar una carta en el organizador
  const renderDeckCard = (card: CardDetails) => (
    <div className="border rounded-md overflow-hidden hover:shadow-md transition-shadow bg-white w-full h-full relative">
      <div className="relative w-full h-full" style={{ aspectRatio: '2.5/3.5' }}>
        <Image
          src={card.imageUrl}
          alt={card.name}
          className="object-cover"
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {/* Botón de eliminar en la esquina inferior derecha */}
        <button
          type="button"
          className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg z-10"
          style={{ minWidth: 32, minHeight: 32 }}
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveCard(card.id);
          }}
          onPointerDown={e => e.stopPropagation()}
          tabIndex={-1}
          title="Eliminar del mazo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );

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
      // Convertir el mapa de cartas a un array de IDs
      const cardIds: string[] = [];
      Object.entries(deckCards).forEach(([cardId, quantity]) => {
        for (let i = 0; i < quantity; i++) {
          cardIds.push(cardId);
        }
      });
      
      // Para simplificar, tratamos todo como creación de nuevo mazo
      // Ya que la edición está dando problemas
      const deckData: Omit<Deck, 'id'> = {
        name: deckName.trim(),
        userUid: user!.id,
        userName: user!.name || 'Usuario',
        userAvatar: user!.avatarUrl || undefined,
        cardIds,
        isPublic,
        description: deckDescription.trim() || undefined
      };
      
      let newDeckId;
      // Si tenemos un ID y no estamos en modo "new", intentar actualizar
      if (deckId && !isNew) {
        // Intentar actualizar, pero si falla, creamos uno nuevo
        try {
          await updateDeck(deckId, {
            name: deckData.name,
            cardIds: deckData.cardIds,
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
        // Crear nuevo
        newDeckId = await createDeck(deckData);
        toast.success('Mazo creado correctamente');
      }
      
      // Navegar al mazo creado/actualizado
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

    // Solo puede existir 1 carta BIO
    if (card.cardType === CardType.BIO) {
      const bioCount = Object.keys(deckCards).reduce((acc, cardId) => {
        const existingCard = allCards.find(c => c.id === cardId);
        if (existingCard && existingCard.cardType === CardType.BIO) {
          return acc + (deckCards[cardId] || 0);
        }
        return acc;
      }, 0);
      if (bioCount >= 1) {
        toast.warning('Solo puede existir 1 carta Bio en el mazo');
        return;
      }
    }

    // Si la carta es un Rava, verificar si ya existe un Rava en el mazo
    if (card.cardType === CardType.RAVA) {
      const hasRavaAlready = Object.keys(deckCards).some(cardId => {
        const existingCard = allCards.find(c => c.id === cardId);
        return existingCard && existingCard.cardType === CardType.RAVA;
      });
      if (hasRavaAlready) {
        toast.error('Solo puede existir 1 carta Rava por mazo');
        return;
      }
    }

    // Si la carta es un PROTECTOR, verificar que no haya más de 2
    if (card.cardType === CardType.PROTECTOR) {
      const protectorsCount = Object.keys(deckCards).reduce((acc, cardId) => {
        const existingCard = allCards.find(c => c.id === cardId);
        if (existingCard && existingCard.cardType === CardType.PROTECTOR) {
          return acc + (deckCards[cardId] || 0);
        }
        return acc;
      }, 0);
      if (protectorsCount >= 2) {
        toast.warning('Solo pueden existir 2 protectores en el mazo');
        return;
      }
    }

    // Si la carta ya está en el deck, mostrar un toast y no agregarla de nuevo
    if (deckCards[card.id]) {
      toast.warning('Esta carta ya está en el mazo');
      return;
    }

    setDeckCards(prev => {
      const currentQty = prev[card.id] || 0;
      return {
        ...prev,
        [card.id]: currentQty + 1
      };
    });
  };

  // Quitar carta del mazo
  const handleRemoveCard = (cardId: string) => {
    setDeckCards(prev => {
      const currentQty = prev[cardId] || 0;
      
      if (currentQty <= 1) {
        const newDeckCards = { ...prev };
        delete newDeckCards[cardId];
        return newDeckCards;
      }
      
      return {
        ...prev,
        [cardId]: currentQty - 1
      };
    });
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
      </div>
    </div>
  );

  // Estado para la carta seleccionada para ver detalles
  const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);

  // Manejar clic en carta para ver detalles
  const handleCardSelect = (card: CardDetails) => {
    setSelectedCard(card);
  };

  // Renderizar tarjeta para el mazo
  const renderCardForDeck = (card: CardDetails, quantity: number) => (
    <div 
      key={card.id} 
      className="flex items-center border rounded-md p-2 mb-2 hover:bg-muted/30 cursor-pointer"
      onClick={() => handleCardSelect(card)}
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
        <span className="w-6 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="md"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            handleAddCard(card);
          }}
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );

  // Renderizar lista de cartas del mazo
  const renderDeckCardsList = () => {
    // Si no hay cartas, mostrar estado vacío
    if (Object.keys(deckCards).length === 0) {
      return (
        <EmptyState
          title="No hay cartas en el mazo"
          description="Agrega cartas desde el catálogo"
          icon="cards"
        />
      );
    }

    // Obtener detalles de las cartas en el mazo
    const deckCardIds = Object.keys(deckCards);
    const deckCardDetails = allCards.filter(card => deckCardIds.includes(card.id));

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
        {/* Columna 1: Detalle de carta seleccionada */}
        <div className="w-72 border-r overflow-y-auto">
          <div className="p-4">
            {selectedCard ? (
              <div>
                <div className="relative aspect-[2.5/3.5] w-full mb-4 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={selectedCard.imageUrl}
                    alt={selectedCard.name}
                    className="object-cover"
                    style={{ width: '100%', height: '100%', position: 'absolute' }}
                  />
                </div>
                <h2 className="text-xl font-semibold mb-2">{selectedCard.name}</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Tipo</p>
                    <p>{selectedCard.cardType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Energía</p>
                    <p>{selectedCard.cardEnergy}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Rareza</p>
                    <p>{selectedCard.rarity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Set</p>
                    <p>{selectedCard.cardSet}</p>
                  </div>
                  {selectedCard.power !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Poder</p>
                      <p>{selectedCard.power}</p>
                    </div>
                  )}
                  {selectedCard.sleep !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Sleep</p>
                      <p>{selectedCard.sleep}</p>
                    </div>
                  )}
                  {selectedCard.description && (
    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedCard.description}</p>
                    </div>
                  )}
                  <div className="pt-3 flex flex-col gap-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddCard(selectedCard)}
                    >
                      <Plus size={16} className="mr-1" />
                      Agregar al mazo
                    </Button>
                    {deckCards[selectedCard.id] && (
                      <Button
                        className="w-full"
                        variant="danger"
                        onClick={() => {
                          handleRemoveCard(selectedCard.id);
                          setSelectedCard(null);
                        }}
                      >
                        Eliminar del mazo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="bg-muted/30 rounded-full p-6 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><path d="m9 16 3-3 3 3"/></svg>
                </div>
                <h3 className="font-semibold text-lg">Selecciona una carta</h3>
                <p className="text-sm text-muted-foreground mt-2">Haz clic en una carta para ver sus detalles</p>
              </div>
            )}
          </div>
        </div>
        {/* Columna 2: Organizador de mazos */}
        <div className="w-[805px] overflow-y-auto">
          <div className="p-4">
            {renderDeckOrganizer()}
          </div>
        </div>
        {/* Columna 3: Catálogo de cartas */}
        <div className="w-[700px] border-l overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
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

