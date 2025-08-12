import { useEffect, useState } from "react";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Column from "./Column";
import { KanbanColumn } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Board = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadBoard = async () => {
    const { data: cols, error: colsError } = await supabase
      .from("columns")
      .select("*")
      .order("position", { ascending: true });
    if (colsError) {
      console.error("Failed to load columns", colsError);
      return;
    }

    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("*")
      .order("position", { ascending: true });
    if (cardsError) {
      console.error("Failed to load cards", cardsError);
      return;
    }

    const colMap = new Map<string, KanbanColumn>();
    (cols ?? []).forEach((c: any) =>
      colMap.set(String(c.id), { id: String(c.id), title: c.title, cards: [] })
    );
    (cards ?? []).forEach((card: any) => {
      const col = colMap.get(String(card.column_id));
      if (col) {
        col.cards.push({ id: String(card.id), title: card.title });
      }
    });
    setColumns(Array.from(colMap.values()));
  };

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCard = async (columnId: string, title: string) => {
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const col = columns.find((c) => c.id === columnId);
    const position = col ? col.cards.length : 0;

    // Optimistic UI update
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId
          ? { ...c, cards: [...c.cards, { id: tempId, title }] }
          : c
      )
    );

    const { data, error } = await supabase
      .from("cards")
      .insert({ column_id: columnId, title, position })
      .select()
      .single();

    if (error) {
      console.error("Failed to add card", error);
      toast({
        title: "Failed to add card",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
      // Rollback optimistic update
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId
            ? { ...c, cards: c.cards.filter((card) => card.id !== tempId) }
            : c
        )
      );
      return;
    }

    console.log("Inserted card", data);
    toast({
      title: "Card created",
      description: `“${title}” added to ${col?.title ?? "column"}.`,
    });
    // Refresh from DB to sync ids/positions
    await loadBoard();
  };

  const handleDeleteCard = async (columnId: string, cardId: string) => {
    const prev = columns;
    // Optimistic remove
    const updated = columns.map((c) =>
      c.id === columnId ? { ...c, cards: c.cards.filter((card) => card.id !== cardId) } : c
    );
    setColumns(updated);

    const { error: delError } = await supabase.from('cards').delete().eq('id', cardId);
    if (delError) {
      console.error('Failed to delete card', delError);
      toast({ title: 'Failed to delete card', description: delError.message || 'Unknown error', variant: 'destructive' });
      setColumns(prev);
      return;
    }

    const remaining = updated.find((c) => c.id === columnId)?.cards ?? [];
    const results = await Promise.all(
      remaining.map((card, idx) =>
        supabase.from('cards').update({ position: idx }).eq('id', card.id)
      )
    );
    const updateError = results.find((r: any) => r?.error);
    if (updateError) {
      console.warn('Positions reindex failed after delete', updateError);
      toast({ title: 'Card deleted', description: 'Reorder sync partially failed. Refresh if order looks off.' });
    } else {
      toast({ title: 'Card deleted' });
    }

    await loadBoard();
  };

  const findColumnIdByCard = (cardId: string) => {
    for (const c of columns) {
      if (c.cards.some((card) => card.id === cardId)) return c.id;
    }
    return null;
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromColId = findColumnIdByCard(activeId);
    if (!fromColId) return;

    let toColId: string | null = null;
    if (columns.some((c) => c.id === overId)) {
      toColId = overId; // Dropped on empty column
    } else {
      toColId = findColumnIdByCard(overId);
    }
    if (!toColId) return;

    if (fromColId === toColId && activeId === overId) return;

    const fromCol = columns.find((c) => c.id === fromColId)!;
    const toCol = columns.find((c) => c.id === toColId)!;

    const fromIndex = fromCol.cards.findIndex((c) => c.id === activeId);
    let toIndex: number;
    if (columns.some((c) => c.id === overId)) {
      toIndex = toCol.cards.length;
    } else {
      toIndex = toCol.cards.findIndex((c) => c.id === overId);
      if (toIndex < 0) toIndex = toCol.cards.length;
    }

    let next: KanbanColumn[];
    if (fromColId === toColId) {
      const newCards = arrayMove(fromCol.cards, fromIndex, toIndex);
      next = columns.map((c) => (c.id === fromColId ? { ...c, cards: newCards } : c));
    } else {
      const moving = fromCol.cards[fromIndex];
      const fromCards = fromCol.cards.filter((c) => c.id !== activeId);
      const toCards = [
        ...toCol.cards.slice(0, toIndex),
        moving,
        ...toCol.cards.slice(toIndex),
      ];
      next = columns.map((c) => {
        if (c.id === fromColId) return { ...c, cards: fromCards };
        if (c.id === toColId) return { ...c, cards: toCards };
        return c;
      });
    }

    setColumns(next);

    try {
      if (fromColId === toColId) {
        const col = next.find((c) => c.id === fromColId)!;
        const updates = col.cards.map((card, idx) =>
          supabase.from("cards").update({ position: idx }).eq("id", card.id)
        );
        const results = await Promise.all(updates);
        const err = results.find((r: any) => r.error);
        if (err) throw err.error;
      } else {
        const fromAfter = next.find((c) => c.id === fromColId)!.cards;
        const toAfter = next.find((c) => c.id === toColId)!.cards;

        const movedIdx = toAfter.findIndex((c) => c.id === activeId);
        const moveRes = await supabase
          .from("cards")
          .update({ column_id: toColId, position: movedIdx })
          .eq("id", activeId);

        if (moveRes.error) throw moveRes.error;

        const updFrom = fromAfter.map((card, idx) =>
          supabase.from("cards").update({ position: idx }).eq("id", card.id)
        );
        const updTo = toAfter.map((card, idx) =>
          supabase.from("cards").update({ position: idx }).eq("id", card.id)
        );
        const results = await Promise.all([...updFrom, ...updTo]);
        const err = results.find((r: any) => r.error);
        if (err) throw err.error;
      }
    } catch (e: any) {
      console.error("Persist reorder/move failed", e);
      toast({
        title: "Sync failed",
        description: e?.message || "Could not save order. Reverting.",
        variant: "destructive",
      });
      await loadBoard();
      return;
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-1">
            {columns.map((col) => (
              <Column key={col.id} column={col} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default Board;
