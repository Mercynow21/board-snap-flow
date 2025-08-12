import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { KanbanCard } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
interface CardItemProps {
  card: KanbanCard;
  onDelete?: () => void;
  onUpdateTitle?: (title: string) => void;
}

const CardItem = ({ card, onDelete, onUpdateTitle }: CardItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(card.title);
  useEffect(() => { setValue(card.title); }, [card.title]);

  const commit = () => {
    const t = value.trim();
    if (!t || t === card.title) { setIsEditing(false); setValue(card.title); return; }
    onUpdateTitle?.(t);
    setIsEditing(false);
  };

  const cancel = () => { setIsEditing(false); setValue(card.title); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };

  return (
    <article
      ref={setNodeRef}
      style={style as CSSProperties}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200"
      aria-label={card.title}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Edit card title"
            />
          ) : (
            <h3
              className="text-sm font-medium leading-5 truncate cursor-text"
              onDoubleClick={() => setIsEditing(true)}
              onClick={() => setIsEditing(true)}
              title={card.title}
            >
              {card.title}
            </h3>
          )}
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete card"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </article>
  );
};

export default CardItem;
