export default function Loading() {
  return (
    <main className="min-h-screen bg-white pt-[90px]" aria-busy="true" aria-label="Loading food">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="aspect-[16/9] animate-pulse rounded-3xl bg-[#F8F9FA]" />
        <div className="h-8 w-1/2 animate-pulse rounded-lg bg-[#F8F9FA]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#F8F9FA]" />
      </div>
    </main>
  );
}
