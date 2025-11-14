import React from 'react';
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { rectIntersection } from '@dnd-kit/core';
import SortableDeckCard from '@/components/molecules/SortableDeckCard';
import DroppableTrash from '@/components/molecules/DroppableTrash';
import type { CardDetails } from '@/types/card';
import { DragOverlay } from '@dnd-kit/core';
import { Image } from '@/components/atoms/Image';

type Props = {
  organizedDeck: {
    protector1?: CardDetails;
    protector2?: CardDetails;
    bio?: CardDetails;
    mainAdendeis: CardDetails[];
    rotCards: CardDetails[];
    iximCards: CardDetails[];
    otherCards: CardDetails[];
  };
  isDragging: boolean;
  activeId: string | null;
  renderDeckCard: (card: CardDetails) => React.ReactElement;
  handleRemoveCard: (id: string) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  sensors?: any;
};

export const DeckEditorOrganizer: React.FC<Props> = ({ organizedDeck, isDragging, activeId, renderDeckCard, handleRemoveCard, onDragStart, onDragEnd, sensors }) => {
  const activeCard = activeId ? (
    organizedDeck.mainAdendeis.find((_, idx) => `mainAdendei-${idx}` === activeId) ||
    organizedDeck.rotCards.find((_, idx) => `rot-${idx}` === activeId) ||
    organizedDeck.iximCards.find((_, idx) => `ixim-${idx}` === activeId) ||
    organizedDeck.otherCards.find((_, idx) => `other-${idx}` === activeId) ||
    (activeId === 'protector1-0' ? organizedDeck.protector1 : null) ||
    (activeId === 'protector2-0' ? organizedDeck.protector2 : null) ||
    (activeId === 'bio-0' ? organizedDeck.bio : null)
  ) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-sm mb-2">Protectores y Bio</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`}>
              {organizedDeck.protector1 ? (
                <div className="relative w-full h-full">
                  <SortableDeckCard card={organizedDeck.protector1} id="protector1-0" renderDeckCard={renderDeckCard} />
                  <div className="absolute top-2 right-2 z-50">
                    <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.protector1!.id); }} aria-label={`Eliminar ${organizedDeck.protector1.name} del mazo`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground"><div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>Protector Principal</div>
              )}
            </div>

            <div className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`}>
              {organizedDeck.protector2 ? (
                <div className="relative w-full h-full">
                  <SortableDeckCard card={organizedDeck.protector2} id="protector2-0" renderDeckCard={renderDeckCard} />
                  <div className="absolute top-2 right-2 z-50">
                    <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.protector2!.id); }} aria-label={`Eliminar ${organizedDeck.protector2.name} del mazo`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground"><div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>Protector Secundario</div>
              )}
            </div>

            <div className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`}>
              {organizedDeck.bio ? (
                <div className="relative w-full h-full">
                  <SortableDeckCard card={organizedDeck.bio} id="bio-0" renderDeckCard={renderDeckCard} />
                  <div className="absolute top-2 right-2 z-50">
                    <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.bio!.id); }} aria-label={`Eliminar ${organizedDeck.bio.name} del mazo`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground"><div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>Bio</div>
              )}
            </div>
          </div>
        </div>

        {/* Rot row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Cartas Rot {organizedDeck.rotCards.length > 0 && `(${organizedDeck.rotCards.length})`}</h3>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {Array(5).fill(null).map((_, idx) => (
              <div key={`rot-${idx}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`} data-droppable-id={`rot-${idx}`}>
                {organizedDeck.rotCards[idx] ? (
                  <div className="relative w-full h-full">
                    <SortableDeckCard card={organizedDeck.rotCards[idx]} id={`rot-${idx}`} renderDeckCard={renderDeckCard} />
                    <div className="absolute top-2 right-2 z-50">
                      <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.rotCards[idx].id); }} aria-label={`Eliminar ${organizedDeck.rotCards[idx].name} del mazo`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground"><div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>Rot {idx + 1}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ixim row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Cartas Ixim {organizedDeck.iximCards.length > 0 && `(${organizedDeck.iximCards.length})`}</h3>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {Array(5).fill(null).map((_, idx) => (
              <div key={`ixim-${idx}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`} data-droppable-id={`ixim-${idx}`}> 
                {organizedDeck.iximCards[idx] ? (
                  <div className="relative w-full h-full">
                    <SortableDeckCard card={organizedDeck.iximCards[idx]} id={`ixim-${idx}`} renderDeckCard={renderDeckCard} />
                    <div className="absolute top-2 right-2 z-50">
                      <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.iximCards[idx].id); }} aria-label={`Eliminar ${organizedDeck.iximCards[idx].name} del mazo`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground"><div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>Ixim {idx + 1}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Adendeis grid */}
        <div>
          <h3 className="font-medium text-sm mb-2">Adendeis y Rava (mínimo 15)</h3>
          {(() => {
            const minRows = 5;
            const cardsCount = organizedDeck.mainAdendeis.length;
            const maxRows = Math.ceil(24 / 3);
            const neededRows = Math.max(minRows, Math.ceil(cardsCount / 3));
            const totalRows = Math.min(neededRows, maxRows);
            return Array(totalRows).fill(null).map((_, rowIdx) => (
              <div key={`adendei-row-${rowIdx}`} className="grid grid-cols-3 gap-3 mb-3">
                {Array(3).fill(null).map((_, colIdx) => {
                  const cardIndex = rowIdx * 3 + colIdx;
                  return (
                    <div key={`adendei-${cardIndex}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`} data-droppable-id={`mainAdendei-${cardIndex}`}>
                      {organizedDeck.mainAdendeis[cardIndex] ? (
                        <div className="relative w-full h-full">
                          <SortableDeckCard card={organizedDeck.mainAdendeis[cardIndex]} id={`mainAdendei-${cardIndex}`} renderDeckCard={renderDeckCard} />
                          <div className="absolute top-2 right-2 z-50">
                            <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(organizedDeck.mainAdendeis[cardIndex].id); }} aria-label={`Eliminar ${organizedDeck.mainAdendeis[cardIndex].name} del mazo`}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground"><div className="mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>Adendei {cardIndex + 1}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* Additional cards */}
        {organizedDeck.otherCards.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-2">Cartas adicionales</h3>
            <div className="grid grid-cols-3 gap-3">
              {organizedDeck.otherCards.map((card, idx) => (
                <div key={`other-${idx}`} className={`border-2 border-dashed rounded-md p-2 h-[220px] w-full flex items-center justify-center card-container transition-colors ${isDragging ? 'border-blue-300 bg-blue-50' : 'border-muted-foreground/20'}`} data-droppable-id={`other-${idx}`}>
                  <div className="relative w-full h-full">
                    <SortableDeckCard card={card} id={`other-${idx}`} renderDeckCard={renderDeckCard} />
                    <div className="absolute top-2 right-2 z-50">
                      <button type="button" className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.id); }} aria-label={`Eliminar ${card.name} del mazo`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="cursor-grabbing transform rotate-3 scale-105 shadow-2xl border-2 border-blue-400 rounded-md overflow-hidden bg-white">
            <div className="relative w-[157px] h-[220px]" style={{ aspectRatio: '2.5/3.5' }}>
              <Image src={activeCard.imageUrl} alt={activeCard.name} className="object-cover" style={{ width: '100%', height: '100%', position: 'absolute' }} sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <DroppableTrash visible={true} />
    </DndContext>
  );
};

export default DeckEditorOrganizer;
