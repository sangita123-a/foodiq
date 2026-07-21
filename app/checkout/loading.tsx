export default function Loading() {
  return (
    <main className="min-h-screen bg-section pt-[90px]" aria-busy="true" aria-label="Loading checkout">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <div className="h-10 w-40 animate-pulse rounded-xl bg-white border border-border" />
        <div className="h-64 animate-pulse rounded-3xl bg-white border border-border" />
        <div className="h-40 animate-pulse rounded-3xl bg-white border border-border" />
      </div>
    </main>
  );
}
