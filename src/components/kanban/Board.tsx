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
  const [columns] = useState<KanbanColumn[]>(initialColumns);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {columns.map((col) => (
          <Column key={col.id} column={col} />
        ))}
      </div>
    </div>
  );
};

export default Board;
