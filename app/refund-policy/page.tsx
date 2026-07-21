import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-[90px]">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="mb-6 text-3xl font-black text-foreground md:text-4xl">
          Refund Policy
        </h1>
        <div className="prose space-y-4 text-[#555555]">
          <p>Last updated: July 2026</p>
          <p>
            At Foodiq, we want every order to arrive fresh and complete. If
            something goes wrong, we will work with you and the restaurant to
            resolve it quickly.
          </p>
          <h2 className="mt-8 text-xl font-bold text-foreground">
            Eligible Refund Scenarios
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Order cancelled by the restaurant or delivery partner</li>
            <li>Significant delay beyond the estimated delivery window</li>
            <li>Missing or incorrect items reported within 24 hours</li>
            <li>Food quality issues verified by our support team</li>
          </ul>
          <h2 className="mt-8 text-xl font-bold text-foreground">
            How to Request a Refund
          </h2>
          <p>
            Contact our support team via the{" "}
            <Link href="/help-support" className="text-primary hover:underline">
              Help Center
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact Us
            </Link>{" "}
            page with your order ID. Approved refunds are credited to your
            original payment method within 5–7 business days.
          </p>
          <h2 className="mt-8 text-xl font-bold text-foreground">Contact</h2>
          <p>
            Questions about refunds? Email{" "}
            <a
              href="mailto:support@foodiq.com"
              className="text-primary hover:underline"
            >
              support@foodiq.com
            </a>
            .
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
