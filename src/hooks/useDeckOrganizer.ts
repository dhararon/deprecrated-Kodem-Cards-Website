import { useCallback } from 'react';
import { useSensor, useSensors, PointerSensor, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { CardDetails, CardType } from '@/types/card';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

type Params = {
  organizedDeck: {
    protector1?: CardDetails;
    protector2?: CardDetails;
    bio?: CardDetails;
    mainAdendeis: CardDetails[];
    rotCards: CardDetails[];
    iximCards: CardDetails[];
    otherCards: CardDetails[];
  };
  setOrganizedDeck: (next: any) => void;
  setCustomOrder: (updater: (prev: any) => any) => void;
  handleRemoveCard: (id: string) => void;
  setActiveId: (id: string | null) => void;
  setIsDragging: (v: boolean) => void;
};

export default function useDeckOrganizer({ organizedDeck, setOrganizedDeck, setCustomOrder, handleRemoveCard, setActiveId, setIsDragging }: Params) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5, tolerance: 5, delay: 0 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(String(active.id));
    setIsDragging(true);
  }, [setActiveId, setIsDragging]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);
    if (!over) return;

    // drop to trash
    if (over.id === 'trash-dropzone') {
      const activeIdStr = String(active.id);
      const [section, indexStr] = activeIdStr.split('-');
      const idx = parseInt(indexStr, 10);
      let cardIdToRemove: string | undefined;
      switch (section) {
        case 'mainAdendei': cardIdToRemove = organizedDeck.mainAdendeis[idx]?.id; break;
        case 'rot': cardIdToRemove = organizedDeck.rotCards[idx]?.id; break;
        case 'ixim': cardIdToRemove = organizedDeck.iximCards[idx]?.id; break;
        case 'other': cardIdToRemove = organizedDeck.otherCards[idx]?.id; break;
        case 'protector1': cardIdToRemove = organizedDeck.protector1?.id; break;
        case 'protector2': cardIdToRemove = organizedDeck.protector2?.id; break;
        case 'bio': cardIdToRemove = organizedDeck.bio?.id; break;
      }
      if (cardIdToRemove) handleRemoveCard(cardIdToRemove);
      return;
    }

    if (active.id !== over.id) {
      const [activeSection, activeIndexStr] = String(active.id).split('-');
      const [overSection, overIndexStr] = String(over.id).split('-');
      const activeIndex = parseInt(activeIndexStr, 10);
      const overIndex = parseInt(overIndexStr, 10);

      setOrganizedDeck((prev: any) => {
        const newDeck = { ...prev };

        if (activeSection === overSection) {
          switch (activeSection) {
            case 'mainAdendei': {
              const fixedArray = new Array(24).fill(undefined);
              prev.mainAdendeis.forEach((card: CardDetails, idx: number) => { fixedArray[idx] = card; });
              const activeCard = fixedArray[activeIndex];
              const overCard = fixedArray[overIndex];
              if (activeCard && overCard) {
                fixedArray[activeIndex] = overCard;
                fixedArray[overIndex] = activeCard;
                setCustomOrder((prevOrder: any) => {
                  const newAdendeis = [...prevOrder.adendeis];
                  const aIdx = newAdendeis.findIndex((id: string) => id === activeCard.id);
                  const oIdx = newAdendeis.findIndex((id: string) => id === overCard.id);
                  if (aIdx !== -1 && oIdx !== -1) [newAdendeis[aIdx], newAdendeis[oIdx]] = [newAdendeis[oIdx], newAdendeis[aIdx]];
                  return { ...prevOrder, adendeis: newAdendeis };
                });
              } else if (activeCard && !overCard) {
                fixedArray[overIndex] = activeCard;
                fixedArray[activeIndex] = undefined;
              }
              newDeck.mainAdendeis = fixedArray.filter((c: any) => c !== undefined);
              break;
            }
            case 'rot': {
              const fixedArray = new Array(4).fill(undefined);
              prev.rotCards.forEach((card: CardDetails, idx: number) => { fixedArray[idx] = card; });
              const activeCard = fixedArray[activeIndex];
              const overCard = fixedArray[overIndex];
              if (activeCard && overCard) {
                fixedArray[activeIndex] = overCard; fixedArray[overIndex] = activeCard;
                setCustomOrder((prevOrder: any) => {
                  const newRot = [...prevOrder.rot];
                  const aIdx = newRot.findIndex((id: string) => id === activeCard.id);
                  const oIdx = newRot.findIndex((id: string) => id === overCard.id);
                  if (aIdx !== -1 && oIdx !== -1) [newRot[aIdx], newRot[oIdx]] = [newRot[oIdx], newRot[aIdx]];
                  return { ...prevOrder, rot: newRot };
                });
              } else if (activeCard && !overCard) { fixedArray[overIndex] = activeCard; fixedArray[activeIndex] = undefined; }
              newDeck.rotCards = fixedArray.filter((c: any) => c !== undefined);
              break;
            }
            case 'ixim': {
              const fixedArray = new Array(4).fill(undefined);
              prev.iximCards.forEach((card: CardDetails, idx: number) => { fixedArray[idx] = card; });
              const activeCard = fixedArray[activeIndex]; const overCard = fixedArray[overIndex];
              if (activeCard && overCard) {
                fixedArray[activeIndex] = overCard; fixedArray[overIndex] = activeCard;
                setCustomOrder((prevOrder: any) => {
                  const newIxim = [...prevOrder.ixim];
                  const aIdx = newIxim.findIndex((id: string) => id === activeCard.id);
                  const oIdx = newIxim.findIndex((id: string) => id === overCard.id);
                  if (aIdx !== -1 && oIdx !== -1) [newIxim[aIdx], newIxim[oIdx]] = [newIxim[oIdx], newIxim[aIdx]];
                  return { ...prevOrder, ixim: newIxim };
                });
              } else if (activeCard && !overCard) { fixedArray[overIndex] = activeCard; fixedArray[activeIndex] = undefined; }
              newDeck.iximCards = fixedArray.filter((c: any) => c !== undefined);
              break;
            }
            case 'other': {
              const newOther = [...prev.otherCards];
              const activeCard = newOther[activeIndex]; const overCard = newOther[overIndex];
              if (activeCard && overCard) {
                newOther[activeIndex] = overCard; newOther[overIndex] = activeCard;
                setCustomOrder((prevOrder: any) => {
                  const newOthers = [...prevOrder.others];
                  const aIdx = newOthers.findIndex((id: string) => id === activeCard.id);
                  const oIdx = newOthers.findIndex((id: string) => id === overCard.id);
                  if (aIdx !== -1 && oIdx !== -1) [newOthers[aIdx], newOthers[oIdx]] = [newOthers[oIdx], newOthers[aIdx]];
                  return { ...prevOrder, others: newOthers };
                });
              } else if (activeCard && !overCard) { newOther[overIndex] = activeCard; newOther[activeIndex] = undefined as any; }
              newDeck.otherCards = newOther.filter((c: any) => c !== undefined);
              break;
            }
          }
        } else if (
          (activeSection === 'protector1' && overSection === 'protector2') ||
          (activeSection === 'protector2' && overSection === 'protector1')
        ) {
          if (activeSection === 'protector1' && overSection === 'protector2') {
            const temp = prev.protector1;
            newDeck.protector1 = prev.protector2; newDeck.protector2 = temp;
            if (temp && prev.protector2) {
              setCustomOrder((prevOrder: any) => {
                const newProtectors = [...prevOrder.protectors];
                const aIdx = newProtectors.findIndex((id: string) => id === temp.id);
                const oIdx = newProtectors.findIndex((id: string) => id === prev.protector2!.id);
                if (aIdx !== -1 && oIdx !== -1) [newProtectors[aIdx], newProtectors[oIdx]] = [newProtectors[oIdx], newProtectors[aIdx]];
                return { ...prevOrder, protectors: newProtectors };
              });
            }
          } else {
            const temp = prev.protector2;
            newDeck.protector2 = prev.protector1; newDeck.protector1 = temp;
            if (temp && prev.protector1) {
              setCustomOrder((prevOrder: any) => {
                const newProtectors = [...prevOrder.protectors];
                const aIdx = newProtectors.findIndex((id: string) => id === temp.id);
                const oIdx = newProtectors.findIndex((id: string) => id === prev.protector1!.id);
                if (aIdx !== -1 && oIdx !== -1) [newProtectors[aIdx], newProtectors[oIdx]] = [newProtectors[oIdx], newProtectors[aIdx]];
                return { ...prevOrder, protectors: newProtectors };
              });
            }
          }
        }

        return newDeck;
      });
    }
  }, [organizedDeck, setOrganizedDeck, setCustomOrder, handleRemoveCard, setActiveId, setIsDragging]);

  return { sensors, handleDragStart, handleDragEnd } as const;
}
