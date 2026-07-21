import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DynamicLegalContent } from "@/components/site/DynamicLegalContent";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-6">Privacy Policy</h1>
        <DynamicLegalContent type="privacy" />
        <div className="prose space-y-4 text-[#555555] mt-6">
          <p>Last updated: July 2026</p>
          <p>
            Foodiq respects your privacy. We collect information you provide when creating an account,
            placing orders, saving addresses, and using our services.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8">Information We Collect</h2>
          <p>Name, email, phone number, delivery addresses, order history, and payment method preferences.</p>
          <h2 className="text-xl font-bold text-foreground mt-8">How We Use Your Data</h2>
          <p>
            To process orders, deliver food, improve our platform, send order updates, and provide customer support.
          </p>
          <h2 className="text-xl font-bold text-foreground mt-8">Contact</h2>
          <p>
            For privacy questions, contact us at{" "}
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
