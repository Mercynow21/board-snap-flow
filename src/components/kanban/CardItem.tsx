import { KanbanCard } from "./types";

interface CardItemProps {
  card: KanbanCard;
}

const CardItem = ({ card }: CardItemProps) => {
  return (
    <article
      className="rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200"
      aria-label={card.title}
    >
      <div className="px-3 py-2">
        <h3 className="text-sm font-medium leading-5">{card.title}</h3>
      </div>
    </article>
  );
};

export default CardItem;
