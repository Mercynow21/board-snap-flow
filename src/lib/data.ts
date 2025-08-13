import { Column, Card } from './types';

export const initialColumns: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export const initialCards: Card[] = [
  { id: '1', title: 'Task 1', columnId: 'todo' },
  { id: '2', title: 'Task 2', columnId: 'todo' },
  { id: '3', title: 'Task 3', columnId: 'in-progress' },
];
