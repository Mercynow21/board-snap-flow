import { useState } from "react";
import Column from "./Column";
import { KanbanColumn } from "./types";

const initialColumns: KanbanColumn[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      { id: "t1", title: "Set up project structure" },
      { id: "t2", title: "Design column & card UI" },
      { id: "t3", title: "Plan drag-and-drop" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      { id: "p1", title: "Wire up dnd-kit" },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      { id: "d1", title: "Create Vite + React + TS app" },
      { id: "d2", title: "Install Tailwind & shadcn" },
    ],
  },
];

const Board = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  const handleAddCard = (columnId: string, title: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: [
                ...col.cards,
                {
                  id:
                    typeof crypto !== "undefined" && "randomUUID" in crypto
                      ? (crypto as any).randomUUID()
                      : `${Date.now()}-${Math.random()}`,
                  title,
                },
              ],
            }
          : col
      )
    );
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
