import Board from "@/components/kanban/Board";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">my board</h1>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Board />
      </main>
    </div>
  );
};

export default Index;
