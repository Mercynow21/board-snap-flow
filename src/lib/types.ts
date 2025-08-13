/**
 * Represents a single card on the Kanban board.
 */
export type Card = {
  id: string;
  title: string;
  columnId: string;
};

/**
 * Represents a single column on the Kanban board.
 */
export type Column = {
  id: string;
  title: string;
};
