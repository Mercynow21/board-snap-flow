export type KanbanCard = {
  id: string;
  title: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};
