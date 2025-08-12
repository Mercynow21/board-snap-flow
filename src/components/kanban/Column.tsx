import { useState, type KeyboardEvent, type CSSProperties } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import CardItem from "./CardItem";
import { KanbanColumn } from "./types";

interface ColumnProps {
  column: KanbanColumn;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onUpdateCardTitle: (columnId: string, cardId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

const Column = ({ column, onAddCard, onDeleteCard, onUpdateCardTitle, onDeleteColumn }: ColumnProps) => {
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
  const { setNodeRef: setColRef, attributes, listeners, transform, transition } = useSortable({ id: column.id });
  const colStyle: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <section ref={setColRef} style={colStyle} className="w-72 shrink-0 flex flex-col gap-3 rounded-xl bg-muted/40 p-3 border border-border" aria-labelledby={`col-${column.id}-title`}>
      <header className="px-1 pb-1 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <div className="flex items-center justify-between gap-2">
          <h2 id={`col-${column.id}-title`} className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <span>{column.title}</span>
            <span className="text-xs text-muted-foreground">({column.cards.length})</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete column"
            className="text-muted-foreground hover:text-destructive"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (confirm("Delete this column? All its cards will be removed.")) {
                onDeleteColumn(column.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-3">
          {column.cards.map((card) => (
            <CardItem key={card.id} card={card} onDelete={() => onDeleteCard(column.id, card.id)} onUpdateTitle={(t) => onUpdateCardTitle(column.id, card.id, t)} />
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
