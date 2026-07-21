export default function Loading() {
  return (
    <main className="min-h-screen bg-section pt-[90px]" aria-busy="true" aria-label="Loading search">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <div className="h-12 animate-pulse rounded-2xl bg-white border border-border" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-border" />
        ))}
      </div>
    </main>
  );
}
