export default function Loading() {
  return (
    <main className="min-h-screen bg-white pt-[80px]" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="h-[42vh] min-h-[280px] animate-pulse rounded-3xl bg-[#F8F9FA]" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-[18px] bg-[#F8F9FA]" />
          ))}
        </div>
      </div>
    </main>
  );
}
