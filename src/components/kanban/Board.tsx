import { useEffect, useState } from "react";
import Column from "./Column";
import { KanbanColumn } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Board = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-1">
          {columns.map((col) => (
            <Column key={col.id} column={col} onAddCard={handleAddCard} onDeleteCard={handleDeleteCard} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
