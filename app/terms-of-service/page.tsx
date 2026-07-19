import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DynamicLegalContent } from "@/components/site/DynamicLegalContent";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-black text-[#222222] mb-6">Terms of Service</h1>
        <DynamicLegalContent type="terms" />
        <div className="prose space-y-4 text-[#555555] mt-6">
          <p>Last updated: July 2026</p>
          <p>
            By using Foodiq, you agree to these terms. Foodiq connects customers with restaurants and delivery
            partners for food ordering and delivery.
          </p>
          <h2 className="text-xl font-bold text-[#111827] mt-8">Orders & Payments</h2>
          <p>
            Prices, availability, and delivery times are set by restaurants. Payments are processed securely
            through our platform. Cash on delivery is available where supported.
          </p>
          <h2 className="text-xl font-bold text-[#111827] mt-8">Cancellations</h2>
          <p>
            Orders may be cancelled before preparation begins. Refunds are processed according to payment method
            and restaurant policy.
          </p>
          <h2 className="text-xl font-bold text-[#111827] mt-8">Contact</h2>
          <p>
            Questions about these terms? Reach us at{" "}
            <a href="mailto:support@foodiq.com" className="text-primary hover:underline">
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
