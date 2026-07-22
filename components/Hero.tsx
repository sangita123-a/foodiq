import HeroContent from "@/components/hero/HeroContent";
import HeroPoster from "@/components/hero/HeroPoster";
import HeroVideoOverlay from "@/components/hero/HeroVideoOverlay";

export default function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-[#0F172A] px-3 py-8 max-md:min-h-[58vh] max-md:max-h-[60vh] max-md:py-4 md:min-h-[660px] md:px-8 md:py-20 lg:min-h-[700px]">
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <HeroPoster />
        <HeroVideoOverlay />
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />
      </div>
      <HeroContent />
    </section>
  );
}
