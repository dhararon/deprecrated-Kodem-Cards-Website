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
import { Search, Plus, Minus, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/Dialog';

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
      <div className="relative h-48 w-full">
        <Image
          src={card.imageUrl}
          alt={card.name}
          className="object-cover"
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />
      </div>
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
        <Plus className="text-white h-12 w-12 opacity-0 group-hover:opacity-100" />
      </div>
      <div className="p-2 bg-white">
        <h3 className="font-semibold text-sm truncate">{card.name}</h3>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{card.cardType}</span>
          <span>{card.cardEnergy}</span>
        </div>
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
          size="icon"
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
          size="icon"
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
      {/* Cabecera */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
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

      {/* Contenido principal - 3 columnas */}
      <div className="flex flex-1 overflow-hidden">
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
                  <div className="pt-3">
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddCard(selectedCard)}
                    >
                      <Plus size={16} className="mr-1" />
                      Agregar al mazo
                    </Button>
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
              </div>
            )}
          </div>
        </div>
        {/* Columna 2: Lista de cartas disponibles */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Renderizar lista de cartas disponibles */}
            {renderDeckCardsList()}
          </div>
        </div>
        {/* Columna 3: Lista de cartas disponibles */}
        <div className="w-72 border-l overflow-y-auto">
          <div className="p-4">
            {/* Renderizar lista de cartas disponibles */}
            {renderDeckCardsList()}
          </div>
        </div>
      </div>
    </div>
  );
}

            