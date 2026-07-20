import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Offline",
  description: "You are offline. Reconnect to continue ordering on Foodiq.",
  path: "/offline",
  noIndex: true,
});

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E23744] text-4xl font-extrabold text-white">
        F
      </div>
      <h1 className="text-2xl font-bold text-[#1C1C1C]">You&apos;re offline</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#686B78]">
        Foodiq needs an internet connection for live menus and checkout. Cached
        pages may still be available while you reconnect.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#E23744] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#C81E34]"
      >
        Try again
      </Link>
    </main>
  );
}
