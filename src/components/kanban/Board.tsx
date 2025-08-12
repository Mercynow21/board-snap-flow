import { useEffect, useState, type KeyboardEvent } from "react";
import Column from "./Column";
import { KanbanColumn } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

const Board = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [newColumnTitle, setNewColumnTitle] = useState("");

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

  const handleUpdateCardTitle = async (columnId: string, cardId: string, newTitle: string) => {
    const prev = columns;
    // Optimistic update
    setColumns((cur) =>
      cur.map((c) =>
        c.id === columnId
          ? {
              ...c,
              cards: c.cards.map((card) => (card.id === cardId ? { ...card, title: newTitle } : card)),
            }
          : c
      )
    );

    const { error } = await supabase.from('cards').update({ title: newTitle }).eq('id', cardId);
    if (error) {
      console.error('Failed to update title', error);
      toast({ title: 'Failed to rename card', description: error.message || 'Unknown error', variant: 'destructive' });
      setColumns(prev);
      return;
    }
  };

  const handleAddColumn = async () => {
    const title = newColumnTitle.trim();
    if (!title) return;

    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const position = columns.length;

    // Optimistic
    setColumns((prev) => [...prev, { id: tempId, title, cards: [] }]);
    setNewColumnTitle("");

    const { data, error } = await supabase
      .from('columns')
      .insert({ title, position })
      .select()
      .single();

    if (error) {
      console.error('Failed to add column', error);
      toast({ title: 'Failed to add column', description: error.message || 'Unknown error', variant: 'destructive' });
      // rollback
      setColumns((prev) => prev.filter((c) => c.id !== tempId));
      return;
    }

    console.log('Inserted column', data);
    toast({ title: 'Column created', description: `“${title}” added.` });
    await loadBoard();
  };

  const handleDeleteColumn = async (columnId: string) => {
    const prev = columns;
    const filtered = columns.filter((c) => c.id !== columnId);
    // Optimistic remove
    setColumns(filtered);

    const { error: delCardsErr } = await supabase.from('cards').delete().eq('column_id', columnId);
    if (delCardsErr) {
      console.error('Failed to delete column cards', delCardsErr);
      toast({ title: 'Failed to delete column', description: delCardsErr.message || 'Unknown error', variant: 'destructive' });
      setColumns(prev);
      return;
    }

    const { error: delColErr } = await supabase.from('columns').delete().eq('id', columnId);
    if (delColErr) {
      console.error('Failed to delete column', delColErr);
      toast({ title: 'Failed to delete column', description: delColErr.message || 'Unknown error', variant: 'destructive' });
      setColumns(prev);
      return;
    }

    // Reindex remaining columns
    const results = await Promise.all(
      filtered.map((c, idx) => supabase.from('columns').update({ position: idx }).eq('id', c.id))
    );
    const updErr = results.find((r: any) => r.error);
    if (updErr) {
      console.warn('Column position reindex failed', updErr);
      toast({ title: 'Column deleted', description: 'Reorder sync partially failed. Refresh if order looks off.' });
    } else {
      toast({ title: 'Column deleted' });
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

    // Reorder columns horizontally
    if (columns.some((c) => c.id === activeId) && columns.some((c) => c.id === overId)) {
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);
      const nextCols = arrayMove(columns, oldIndex, newIndex);
      setColumns(nextCols);
      try {
        const results = await Promise.all(
          nextCols.map((c, idx) => supabase.from('columns').update({ position: idx }).eq('id', c.id))
        );
        const err = results.find((r: any) => r.error);
        if (err) throw err.error;
      } catch (e: any) {
        console.error('Persist column reorder failed', e);
        toast({ title: 'Sync failed', description: e?.message || 'Could not save column order. Reverting.', variant: 'destructive' });
        await loadBoard();
      }
      return;
    }

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

  const onAddColumnKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddColumn();
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-1">
            <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <Column
                  key={col.id}
                  column={col}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onUpdateCardTitle={handleUpdateCardTitle}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}
              <section className="w-72 shrink-0 flex flex-col gap-3 rounded-xl bg-muted/40 p-3 border border-border">
                <header className="px-1 pb-1">
                  <h2 className="text-sm font-semibold tracking-wide">Add Column</h2>
                </header>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      onKeyDown={onAddColumnKeyDown}
                      placeholder="Column title"
                      aria-label="Column title"
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={handleAddColumn}
                      className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:opacity-90"
                      aria-label="Add column"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>
            </SortableContext>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default Board;
