import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { CardDetails, CardType, CardEnergy, CardRarity, CardSet } from '@/types/card';
import { Deck, DeckCardSlot } from '@/types/deck';
import {
  getDeckById,
  createDeck,
  updateDeck,
  checkDeckNameExists
} from '@/lib/firebase/services/deckService';
import { queryCards } from '@/lib/firebase/services/cardService';

type UserLike = { id: string; name?: string; avatarUrl?: string } | null;

export default function useDeckEditor(user: UserLike, deckId: string, isNew: boolean, navigate: (path: string) => void) {
  const MAX_ROT_CARDS = 5;
  const MAX_IXIM_CARDS = 5;
  const MAX_RAVA_CARDS = 2;
  const MAX_BIO_CARDS = 1;
  const MAX_PROTECTOR_CARDS = 2;
  const MAX_ADENDEI_CARDS = 24;

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
  const [deckCardOrder, setDeckCardOrder] = useState<string[]>([]);
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

  const [nameError, setNameError] = useState('');

  const typeOptions = useMemo(() => Object.values(CardType), []);
  const energyOptions = useMemo(() => Object.values(CardEnergy), []);
  const rarityOptions = useMemo(() => Object.values(CardRarity), []);
  const setOptions = useMemo(() => Object.values(CardSet), []);

  const totalCards = useMemo(() => Object.values(deckCards).reduce((acc, qty) => acc + qty, 0), [deckCards]);

  // Load available cards
  useEffect(() => {
    const loadCards = async () => {
      if (!user) return;
      setIsLoadingCards(true);
      try {
        const fetched = await queryCards({});
        setAllCards(fetched);
        setFilteredCards(fetched);
      } catch (err) {
        console.error('Error loading cards', err);
        toast.error('Error al cargar las cartas disponibles');
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadCards();
  }, [user]);

  // Load existing deck when editing
  useEffect(() => {
    if (!user || isNew || !deckId) return;

    const loadExistingDeck = async () => {
      setIsLoading(true);
      try {
        const existing = await getDeckById(deckId);
        if (!existing) {
          toast.error('No se encontró el mazo solicitado');
          navigate('/decks');
          return;
        }

        if (existing.userUid !== user.id) {
          toast.error('No tienes permiso para editar este mazo');
          navigate('/decks');
          return;
        }

        setDeck(existing);
        setDeckName(existing.name);
        setDeckDescription(existing.description || '');
        setIsPublic(existing.isPublic);

        if (existing.deckSlots && existing.deckSlots.length > 0 && allCards.length > 0) {
          const cardCounts: Record<string, number> = {};
          const cardOrder: string[] = [];

          existing.deckSlots.forEach((slot: DeckCardSlot) => {
            cardCounts[slot.cardId] = (cardCounts[slot.cardId] || 0) + 1;
            if (!cardOrder.includes(slot.cardId)) cardOrder.push(slot.cardId);
          });

          setDeckCards(cardCounts);
          setDeckCardOrder(cardOrder);

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
                if (!initialCustomOrder.protectors.includes(cardId)) initialCustomOrder.protectors.push(cardId);
                break;
              case CardType.BIO:
                if (!initialCustomOrder.bio.includes(cardId)) initialCustomOrder.bio.push(cardId);
                break;
              case CardType.ROT:
                if (!initialCustomOrder.rot.includes(cardId)) initialCustomOrder.rot.push(cardId);
                break;
              case CardType.IXIM:
                if (!initialCustomOrder.ixim.includes(cardId)) initialCustomOrder.ixim.push(cardId);
                break;
              default:
                if (!initialCustomOrder.others.includes(cardId)) initialCustomOrder.others.push(cardId);
                break;
            }
          });

          setCustomOrder(initialCustomOrder);
        }
      } catch (err) {
        console.error('Error loading deck', err);
        toast.error('Error al cargar el mazo');
        navigate('/decks');
      } finally {
        setIsLoading(false);
      }
    };

    if (allCards.length > 0) loadExistingDeck();
  }, [user, isNew, deckId, navigate, allCards]);

  // Categorize & organize cards into organizedDeck based on customOrder and deckCards
  useEffect(() => {
    if (allCards.length === 0) return;

    const getCardsInCustomOrder = (cardIds: string[], cardType: CardType | CardType[]) => {
      return cardIds
        .filter(cardId => deckCards[cardId])
        .map(cardId => allCards.find(card => card.id === cardId))
        .filter(Boolean) as CardDetails[];
    };

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

    const allDeckCardDetails = deckCardOrder
      .filter(cardId => deckCards[cardId])
      .map(cardId => allCards.find(card => card.id === cardId))
      .filter(Boolean) as CardDetails[];

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
              if (!newOrder.protectors.includes(card.id)) newOrder.protectors = [...newOrder.protectors, card.id];
              break;
            case CardType.BIO:
              if (!newOrder.bio.includes(card.id)) newOrder.bio = [...newOrder.bio, card.id];
              break;
            case CardType.ROT:
              if (!newOrder.rot.includes(card.id)) newOrder.rot = [...newOrder.rot, card.id];
              break;
            case CardType.IXIM:
              if (!newOrder.ixim.includes(card.id)) newOrder.ixim = [...newOrder.ixim, card.id];
              break;
            default:
              if (!newOrder.others.includes(card.id)) newOrder.others = [...newOrder.others, card.id];
              break;
          }
        });
        return newOrder;
      });
      return;
    }

    const organizedProtectors = protectors.slice(0, 2);
    const organizedBio = bioCards.slice(0, 1);
    const organizedRot = rotCards.slice(0, 5);
    const organizedIxim = iximCards.slice(0, 5);
    const allAdendeis = adendeiCards.slice(0, 24);

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

  // Validation helpers
  const validateDeckRules = (currentDeckCards: Record<string, number>, newCard?: CardDetails) => {
    const currentCardIds = Object.keys(currentDeckCards);
    const currentCardDetails = allCards.filter(card => currentCardIds.includes(card.id));
    let cardsToValidate = currentCardDetails;
    if (newCard) cardsToValidate = [...currentCardDetails, newCard];

    let rotCount = 0;
    let iximCount = 0;
    let ravaCount = 0;
    let bioCount = 0;
    let protectorCount = 0;
    let adendeiCount = 0;
    const nameCount = new Map<string, number>();

    cardsToValidate.forEach(card => {
      const cardId = card.id;
      const quantity = currentDeckCards[cardId] || (newCard && newCard.id === cardId ? 1 : 0);
      const normalizedName = card.name.toLowerCase();
      nameCount.set(normalizedName, (nameCount.get(normalizedName) || 0) + quantity);

      switch (card.cardType) {
        case CardType.ROT:
          rotCount += quantity; break;
        case CardType.IXIM:
          iximCount += quantity; break;
        case CardType.RAVA:
          ravaCount += quantity; break;
        case CardType.BIO:
          bioCount += quantity; break;
        case CardType.PROTECTOR:
          protectorCount += quantity; break;
        case CardType.ADENDEI:
        case CardType.ADENDEI_TITAN:
        case CardType.ADENDEI_GUARDIAN:
        case CardType.ADENDEI_CATRIN:
        case CardType.ADENDEI_KOSMICO:
        case CardType.ADENDEI_EQUINO:
        case CardType.ADENDEI_ABISMAL:
        case CardType.ADENDEI_INFECTADO:
        case CardType.ADENDEI_RESURRECTO:
          adendeiCount += quantity; break;
      }
    });

    for (const [name, count] of nameCount.entries()) {
      if (count > 1) return { isValid: false, error: `Solo puede existir 1 carta con el nombre "${name}" en el mazo` };
    }

    if (rotCount > MAX_ROT_CARDS) return { isValid: false, error: `Máximo ${MAX_ROT_CARDS} cartas Rot permitidas (tienes ${rotCount})` };
    if (iximCount > MAX_IXIM_CARDS) return { isValid: false, error: `Máximo ${MAX_IXIM_CARDS} cartas Ixim permitidas (tienes ${iximCount})` };
    if (ravaCount > MAX_RAVA_CARDS) return { isValid: false, error: `Máximo ${MAX_RAVA_CARDS} carta Rava permitida (tienes ${ravaCount})` };
    if (bioCount > MAX_BIO_CARDS) return { isValid: false, error: `Máximo ${MAX_BIO_CARDS} carta Bio permitida (tienes ${bioCount})` };
    if (protectorCount > MAX_PROTECTOR_CARDS) return { isValid: false, error: `Máximo ${MAX_PROTECTOR_CARDS} Protectores permitidos (tienes ${protectorCount})` };
    if (adendeiCount > MAX_ADENDEI_CARDS) return { isValid: false, error: `Máximo ${MAX_ADENDEI_CARDS} Adendeis permitidos (tienes ${adendeiCount})` };

    return { isValid: true };
  };

  const validateCompleteDeck = (deckCardsArg: Record<string, number>) => {
    const errors: string[] = [];
    const cardIds = Object.keys(deckCardsArg);
    const cardDetails = allCards.filter(card => cardIds.includes(card.id));

    let rotCount = 0; let iximCount = 0; let ravaCount = 0; let bioCount = 0; let protectorCount = 0; let adendeiCount = 0;

    cardDetails.forEach(card => {
      const quantity = deckCardsArg[card.id];
      switch (card.cardType) {
        case CardType.ROT: rotCount += quantity; break;
        case CardType.IXIM: iximCount += quantity; break;
        case CardType.RAVA: ravaCount += quantity; break;
        case CardType.BIO: bioCount += quantity; break;
        case CardType.PROTECTOR: protectorCount += quantity; break;
        case CardType.ADENDEI:
        case CardType.ADENDEI_TITAN:
        case CardType.ADENDEI_GUARDIAN:
        case CardType.ADENDEI_CATRIN:
        case CardType.ADENDEI_KOSMICO:
        case CardType.ADENDEI_EQUINO:
        case CardType.ADENDEI_ABISMAL:
        case CardType.ADENDEI_INFECTADO:
        case CardType.ADENDEI_RESURRECTO:
          adendeiCount += quantity; break;
      }
    });

    if (protectorCount < 1) errors.push('Se requiere al menos 1 Protector');
    if (adendeiCount < 15) errors.push(`Se requieren al menos 15 Adendeis (tienes ${adendeiCount})`);

    return { isValid: errors.length === 0, errors };
  };

  // Save deck
  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      setNameError('El nombre del mazo es obligatorio');
      return;
    }

    if (totalCards === 0) {
      toast.error('Debes agregar al menos una carta al mazo');
      return;
    }

    const deckValidation = validateCompleteDeck(deckCards);
    if (!deckValidation.isValid) {
      deckValidation.errors.forEach(err => toast.error(err));
      return;
    }

    try {
      const nameExists = await checkDeckNameExists(user!.id, deckName.trim(), deckId || undefined);
      if (nameExists.exists) {
        setNameError('Ya tienes un mazo con este nombre');
        return;
      }
    } catch (err) {
      console.error('Error checking name', err);
      toast.error('Error al verificar el nombre del mazo');
      return;
    }

    setIsSaving(true);
    try {
      const deckSlots: DeckCardSlot[] = [];
      let currentRow = 0; let currentCol = 0; const maxCols = 3;
      const addCardsToSlots = (cards: CardDetails[]) => {
        cards.forEach(card => {
          deckSlots.push({ cardId: card.id, row: currentRow, col: currentCol });
          currentCol++;
          if (currentCol >= maxCols) { currentCol = 0; currentRow++; }
        });
      };

      if (organizedDeck.protector1) addCardsToSlots([organizedDeck.protector1]);
      if (organizedDeck.protector2) addCardsToSlots([organizedDeck.protector2]);
      if (organizedDeck.bio) addCardsToSlots([organizedDeck.bio]);
      addCardsToSlots(organizedDeck.rotCards);
      addCardsToSlots(organizedDeck.iximCards);
      addCardsToSlots(organizedDeck.mainAdendeis);
      addCardsToSlots(organizedDeck.otherCards);

      const cardIds = deckSlots.map(s => s.cardId);
      const deckData: Omit<Deck, 'id'> & { deckSlots: DeckCardSlot[] } = {
        name: deckName.trim(),
        userUid: user!.id,
        userName: user!.name || 'Usuario',
        userAvatar: user!.avatarUrl || undefined,
        isPublic,
        description: deckDescription.trim() || "",
        cardIds,
        deckSlots
      };

      let newDeckId;
      if (deckId && !isNew) {
        try {
          await updateDeck(deckId, { name: deckData.name, deckSlots: deckData.deckSlots, isPublic: deckData.isPublic, description: deckData.description });
          newDeckId = deckId;
          toast.success('Mazo actualizado correctamente');
        } catch (err) {
          console.error('Error updating, creating new deck', err);
          newDeckId = await createDeck(deckData);
          toast.success('No se pudo actualizar, se ha creado un nuevo mazo');
        }
      } else {
        newDeckId = await createDeck(deckData);
        toast.success('Mazo creado correctamente');
      }
      navigate(`/decks/${newDeckId}`);
    } catch (err) {
      console.error('Error saving deck', err);
      toast.error('Error al guardar el mazo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deckId || isNew) {
      toast.error('No se puede eliminar un mazo que no ha sido guardado');
      return;
    }
    setIsLoading(true);
    try {
      try {
        await import('@/lib/firebase/services/deckService').then(m => m.deleteDeck(deckId));
        toast.success('Mazo eliminado correctamente');
      } catch (err) {
        console.error('Error deleting deck', err);
        toast.error('Error al eliminar el mazo');
      }
      navigate('/decks');
    } catch (err) {
      console.error('Error processing delete', err);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
      setConfirmDeleteDialogOpen(false);
    }
  };

  // Card add/remove
  const handleAddCard = (card: CardDetails) => {
    if (card.cardType === CardType.TOKEN) {
      toast.warning('No se pueden agregar cartas de tipo Token al mazo');
      return;
    }

    const validation = validateDeckRules(deckCards, card);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const existingCard = deckCardOrder.find(cardId => {
      const existing = allCards.find(c => c.id === cardId);
      return existing && existing.name.toLowerCase() === card.name.toLowerCase();
    });

    if (existingCard) {
      toast.warning(`Ya existe una carta con el nombre "${card.name}" en el mazo`);
      return;
    }

    setDeckCards(prev => ({ ...prev, [card.id]: 1 }));
    setDeckCardOrder(prev => [...prev, card.id]);

    setCustomOrder(prev => {
      const newOrder = { ...prev };
      switch (card.cardType) {
        case CardType.PROTECTOR:
          if (!newOrder.protectors.includes(card.id)) newOrder.protectors = [...newOrder.protectors, card.id];
          break;
        case CardType.BIO:
          if (!newOrder.bio.includes(card.id)) newOrder.bio = [...newOrder.bio, card.id];
          break;
        case CardType.ROT:
          if (!newOrder.rot.includes(card.id)) newOrder.rot = [...newOrder.rot, card.id];
          break;
        case CardType.IXIM:
          if (!newOrder.ixim.includes(card.id)) newOrder.ixim = [...newOrder.ixim, card.id];
          break;
        default:
          if (!newOrder.others.includes(card.id)) newOrder.others = [...newOrder.others, card.id];
          break;
      }
      return newOrder;
    });

    toast.success(`${card.name} agregada al mazo`);
  };

  const handleRemoveCard = (cardId: string) => {
    const removed = allCards.find(c => c.id === cardId);
    setDeckCards(prev => { const next = { ...prev }; delete next[cardId]; return next; });
    setDeckCardOrder(prev => prev.filter(id => id !== cardId));
    setCustomOrder(prev => ({
      protectors: prev.protectors.filter(id => id !== cardId),
      bio: prev.bio.filter(id => id !== cardId),
      rot: prev.rot.filter(id => id !== cardId),
      ixim: prev.ixim.filter(id => id !== cardId),
      adendeis: prev.adendeis.filter(id => id !== cardId),
      others: prev.others.filter(id => id !== cardId)
    }));
    if (removed) toast.success(`${removed.name} eliminada del mazo`);
  };

  // Filters
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoadingCards(true);
      try {
        const filters: any = { searchTerm: searchTerm || undefined };
        if (selectedType !== 'all_types') filters.type = selectedType as CardType;
        if (selectedEnergy !== 'all_energies') filters.energy = selectedEnergy as CardEnergy;
        if (selectedRarity !== 'all_rarities') filters.rarity = selectedRarity as CardRarity;
        if (selectedSet !== 'all_sets') filters.set = selectedSet as CardSet;

        if (Object.keys(filters).length === 0) setFilteredCards(allCards);
        else {
          const results = await queryCards(filters);
          setFilteredCards(results);
        }
      } catch (err) {
        console.error('Error filtering cards', err);
        toast.error('Error al filtrar las cartas');
      } finally {
        setIsLoadingCards(false);
      }
    };

    if (allCards.length > 0) applyFilters();
  }, [allCards, searchTerm, selectedType, selectedEnergy, selectedRarity, selectedSet]);

  // Drag state helpers (lightweight, rendering stays in page)
  const handleDragStart = (active: { id: any }) => {
    setActiveId(String(active.id));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setActiveId(null);
    setIsDragging(false);
  };

  return {
    // deck
    deck,
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
    error,
    // cards
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
    // handlers
    handleSaveDeck,
    handleDeleteDeck,
    handleAddCard,
    handleRemoveCard,
    handleDragStart,
    handleDragEnd
  } as const;
}
