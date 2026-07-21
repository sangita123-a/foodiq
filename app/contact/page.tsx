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
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[#E23744]/15 selection:text-[#1C1C1C] pt-[90px]">
      <Navbar />

      <ContactHero />

      <div className="container mx-auto px-4 md:px-8 py-20">
        
        <div className="flex flex-col lg:flex-row gap-8">
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
