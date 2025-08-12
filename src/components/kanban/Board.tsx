import { useEffect, useState } from "react";
import Column from "./Column";
import { KanbanColumn } from "./types";
import { supabase } from "@/integrations/supabase/client";

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

    const { error } = await supabase
      .from("cards")
      .insert({ column_id: columnId, title, position });

    if (error) {
      console.error("Failed to add card", error);
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

    // Refresh from DB to sync ids/positions
    await loadBoard();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-1">
          {columns.map((col) => (
            <Column key={col.id} column={col} onAddCard={handleAddCard} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
