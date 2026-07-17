"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import OurMission from "@/components/about/OurMission";
import WhyChooseUs from "@/components/about/WhyChooseUs";
import Achievements from "@/components/about/Achievements";
import OurValues from "@/components/about/OurValues";
import AboutCTA from "@/components/about/AboutCTA";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <AboutHero />
      <OurStory />
      <OurMission />
      <WhyChooseUs />
      <Achievements />
      <OurValues />
      <AboutCTA />

      <Footer />
    </main>
  );
}
