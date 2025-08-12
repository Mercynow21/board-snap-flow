import CardItem from "./CardItem";
import { KanbanColumn } from "./types";

interface ColumnProps {
  column: KanbanColumn;
}

const Column = ({ column }: ColumnProps) => {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3 border border-border" aria-labelledby={`col-${column.id}-title`}>
      <header className="px-1 pb-1">
        <h2 id={`col-${column.id}-title`} className="text-sm font-semibold tracking-wide">
          {column.title}
        </h2>
      </header>
      <div className="flex flex-col gap-3">
        {column.cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
};

export default Column;
