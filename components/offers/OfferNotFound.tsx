import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tag, ArrowLeft } from "lucide-react";

type Props = {
  offerId?: string;
};

export default function OfferNotFound({ offerId }: Props) {
  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-20 max-w-lg text-center">
        <div className="bg-[#171717] border border-white/10 rounded-3xl p-10">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center mx-auto mb-6">
            <Tag className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Offer Not Found</h1>
          <p className="text-gray-400 mb-2">
            {offerId
              ? `We couldn't find an offer matching "${offerId}".`
              : "We couldn't find the offer you're looking for."}
          </p>
          <p className="text-gray-500 text-sm mb-8">
            It may have expired or the link might be incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/offers"
              className="inline-flex items-center justify-center gap-2 bg-[#FF2D3B] hover:bg-[#e02633] text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse Offers
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-gray-300 hover:text-white px-6 py-3 rounded-xl border border-white/10 font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
