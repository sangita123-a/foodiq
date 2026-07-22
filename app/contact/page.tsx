"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactHero from "@/components/contact/ContactHero";
import ContactForm from "@/components/contact/ContactForm";
import ContactInfo from "@/components/contact/ContactInfo";
import QuickContactCards from "@/components/contact/QuickContactCards";
import MapSection from "@/components/contact/MapSection";
import FaqPreview from "@/components/contact/FaqPreview";
import Newsletter from "@/components/contact/Newsletter";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/15 selection:text-foreground pt-[56px] max-md:pt-14 md:pt-[90px]">
      <Navbar />

      <ContactHero />

      <div className="container mx-auto px-3 py-4 max-md:px-3 max-md:py-3 md:px-8 md:py-20">
        
        <div className="flex flex-col gap-2 max-md:gap-2 lg:flex-row md:gap-8">
          {/* Left: Contact Form (55%) */}
          <div className="w-full lg:w-[55%]">
            <ContactForm />
          </div>

          {/* Right: Contact Information (45%) */}
          <div className="w-full lg:w-[45%]">
            <ContactInfo />
          </div>
        </div>

      </div>

      <QuickContactCards />
      
      <MapSection />

      <FaqPreview />

      <Newsletter />

      <Footer />
    </main>
  );
}
