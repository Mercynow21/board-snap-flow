import { useState, type KeyboardEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import CardItem from "./CardItem";
import { KanbanColumn } from "./types";

interface ColumnProps {
  column: KanbanColumn;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
}

const Column = ({ column, onAddCard, onDeleteCard }: ColumnProps) => {
  const [newTitle, setNewTitle] = useState("");
  const submit = () => {
    const t = newTitle.trim();
    if (!t) return;
    onAddCard(column.id, t);
    setNewTitle("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <section className="w-72 shrink-0 flex flex-col gap-3 rounded-xl bg-muted/40 p-3 border border-border" aria-labelledby={`col-${column.id}-title`}>
      <header className="px-1 pb-1">
        <h2 id={`col-${column.id}-title`} className="text-sm font-semibold tracking-wide">
          {column.title}
        </h2>
      </header>
      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-3">
          {column.cards.map((card) => (
            <CardItem key={card.id} card={card} onDelete={() => onDeleteCard(column.id, card.id)} />
          ))}
        </div>
      </SortableContext>
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add card"
            aria-label="Add card"
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:opacity-90"
            aria-label="Add card"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
};

export default Column;
