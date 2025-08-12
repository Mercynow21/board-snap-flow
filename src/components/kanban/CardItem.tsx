import { KanbanCard } from "./types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
interface CardItemProps {
  card: KanbanCard;
  onDelete?: () => void;
}

const CardItem = ({ card, onDelete }: CardItemProps) => {
  return (
    <article
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
