import Board from "@/components/kanban/Board";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">Lightweight Kanban Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trello-style board. Drag-and-drop ready. Supabase persistence coming next.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Board />
      </main>
    </div>
  );
};

export default Index;
