export default function Loading() {
  return (
    <main className="min-h-screen bg-white pt-[90px]" aria-busy="true" aria-label="Loading restaurant">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="h-56 animate-pulse rounded-3xl bg-[#F8F9FA] md:h-72" />
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-[#F8F9FA]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#F8F9FA]" />
          ))}
        </div>
      </div>
    </main>
  );
}
