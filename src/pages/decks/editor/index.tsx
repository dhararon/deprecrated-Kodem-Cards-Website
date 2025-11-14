import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { CardDetails } from '@/types/card';
import useDeckEditor from '@/hooks/useDeckEditor';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { Image } from '@/components/atoms/Image';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/atoms/Dialog';
import DeckEditorHeader from '@/components/organisms/DeckEditorHeader';
import DeckEditorCatalog from '@/components/organisms/DeckEditorCatalog';
import useDeckOrganizer from '@/hooks/useDeckOrganizer';
import SortableDeckCard from '@/components/molecules/SortableDeckCard';
import DeckCard from '@/components/molecules/DeckCard';
import { DndContext, DragOverlay, rectIntersection } from '@dnd-kit/core';

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
    activeId,
    isDragging,
    setCustomOrder,
    organizedDeck,
    searchTerm,
    setSearchTerm,
    selectedType,
    setSelectedType,
    selectedEnergy,
    setSelectedEnergy,
    nameError,
    setNameError,
    typeOptions,
    energyOptions,
  handleSaveDeck,
  handleDeleteDeck,
  handleAddCard,
  handleRemoveCard,
    setOrganizedDeck,
    setActiveId,
    setIsDragging
  } = useDeckEditor(user, deckId, isNew, navigate);

  const { sensors, handleDragStart, handleDragEnd } = useDeckOrganizer({
    organizedDeck,
    setOrganizedDeck,
    setCustomOrder,
    handleRemoveCard,
    setActiveId,
    setIsDragging
  });

  // Using shared molecules for sortable card and droppable trash to avoid duplication

  // Estados para controlar las secciones colapsables
  const [isRotExpanded, setIsRotExpanded] = useState(true);
  const [isIximExpanded, setIsIximExpanded] = useState(true);

  // Renderizar el organizador
  const renderDeckOrganizer = () => {
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
                  <SortableDeckCard
                    card={organizedDeck.protector1}
                    id="protector1-0"
                    renderDeckCard={card => <DeckCard card={card} onRemove={handleRemoveCard} />}
                  />
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
                  <SortableDeckCard
                    card={organizedDeck.protector2}
                    id="protector2-0"
                    renderDeckCard={card => <DeckCard card={card} onRemove={handleRemoveCard} />}
                  />
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
                  <SortableDeckCard
                    card={organizedDeck.bio}
                    id="bio-0"
                    renderDeckCard={card => <DeckCard card={card} onRemove={handleRemoveCard} />}
                  />
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
                        <SortableDeckCard
                          card={organizedDeck.rotCards[idx]}
                          id={`rot-${idx}`}
                          renderDeckCard={(card) => renderDeckCard(card)}
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
                        <SortableDeckCard
                          card={organizedDeck.iximCards[idx]}
                          id={`ixim-${idx}`}
                          renderDeckCard={(card) => renderDeckCard(card)}
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
                            <SortableDeckCard
                              card={organizedDeck.mainAdendeis[cardIndex]}
                              id={`mainAdendei-${cardIndex}`}
                              renderDeckCard={(card) => renderDeckCard(card)}
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
                      <SortableDeckCard
                        card={card}
                        id={`other-${idx}`}
                        renderDeckCard={(card) => renderDeckCard(card)}
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