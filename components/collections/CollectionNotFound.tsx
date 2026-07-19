import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Props = {
  slug: string;
};

export default function CollectionNotFound({ slug }: Props) {
  return (
    <main className="min-h-screen bg-white pt-[90px]">
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="mb-3 text-3xl font-black text-[#1A1A1A]">Collection not found</h1>
        <p className="mb-8 text-[#666666]">
          We couldn&apos;t find a collection for &quot;{slug}&quot;.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-[#E23744] px-6 py-3 font-bold text-white hover:bg-[#C81E34]"
        >
          Back to Home
        </Link>
      </div>
      <Footer />
    </main>
  );
}
