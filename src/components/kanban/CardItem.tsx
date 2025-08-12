import { KanbanCard } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
interface CardItemProps {
  card: KanbanCard;
  onDelete?: () => void;
}

const CardItem = ({ card, onDelete }: CardItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style as React.CSSProperties}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200"
      aria-label={card.title}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium leading-5 truncate">{card.title}</h3>
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
