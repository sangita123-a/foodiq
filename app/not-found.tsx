import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Page Not Found",
  description: "The page you requested could not be found on Foodiq.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="mb-3 text-4xl font-black text-[#1C1C1C]">404</h1>
      <p className="mb-8 max-w-md text-[#686B78]">
        The page you are looking for does not exist or may have moved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-[#E23744] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#C81E34]"
        >
          Go Home
        </Link>
        <Link
          href="/order-online"
          className="rounded-xl border border-[#ECECEC] px-5 py-2.5 text-sm font-bold text-[#1C1C1C] transition-colors hover:border-[#E23744]/30"
        >
          Browse Restaurants
        </Link>
        <Link
          href="/help-support"
          className="rounded-xl border border-[#ECECEC] px-5 py-2.5 text-sm font-bold text-[#1C1C1C] transition-colors hover:border-[#E23744]/30"
        >
          Get Help
        </Link>
      </div>
    </main>
  );
}
