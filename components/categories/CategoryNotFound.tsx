import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Props = {
  slug: string;
};

export default function CategoryNotFound({ slug }: Props) {
  return (
    <main className="min-h-screen bg-white pt-[90px]">
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="mb-3 text-3xl font-black text-foreground">Category not found</h1>
        <p className="mb-8 text-gray-text">
          We couldn&apos;t find a collection for &quot;{slug}&quot;.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary-hover"
        >
          Browse categories
        </Link>
      </div>
      <Footer />
    </main>
  );
}
