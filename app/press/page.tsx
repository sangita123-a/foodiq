import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PressPage() {
  return (
    <main className="min-h-screen bg-background pt-[90px]">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="mb-6 text-3xl font-black text-foreground md:text-4xl">
          Press & Media
        </h1>
        <div className="prose space-y-4 text-[#555555]">
          <p>
            For media enquiries, interview requests, and brand assets, contact
            our communications team.
          </p>
          <h2 className="mt-8 text-xl font-bold text-foreground">Media Contact</h2>
          <p>
            Email:{" "}
            <a
              href="mailto:press@foodiq.com"
              className="text-primary hover:underline"
            >
              press@foodiq.com
            </a>
          </p>
          <p>
            Phone:{" "}
            <a
              href="tel:+9118001234567"
              className="text-primary hover:underline"
            >
              +91 1800 123 4567
            </a>
          </p>
          <h2 className="mt-8 text-xl font-bold text-foreground">About Foodiq</h2>
          <p>
            Foodiq connects hungry customers with the best local restaurants,
            offering fast delivery, curated offers, and a seamless ordering
            experience across web and mobile.
          </p>
          <p>
            <Link href="/about" className="text-primary hover:underline">
              Read our full story
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
