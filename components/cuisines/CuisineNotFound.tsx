import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";

type Props = {
  slug?: string;
};

export default function CuisineNotFound({ slug }: Props) {
  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-20 max-w-lg text-center">
        <div className="bg-section border border-border rounded-3xl p-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center mx-auto mb-6">
            <UtensilsCrossed className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Cuisine Not Found</h1>
          <p className="text-gray-text mb-8">
            {slug
              ? `We couldn't find a cuisine matching "${slug}".`
              : "We couldn't find the cuisine you're looking for."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
