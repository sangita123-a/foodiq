import Image from "next/image";
import {
  CARD_IMAGE_QUALITY,
  HERO_POSTER_SIZES,
  HERO_POSTER_WEBP,
} from "@/lib/performance/assets";

/** Server-rendered LCP candidate — discoverable in initial HTML. */
export default function HeroPoster() {
  return (
    <Image
      src={HERO_POSTER_WEBP}
      alt="Foodiq online food delivery"
      fill
      priority
      fetchPriority="high"
      quality={CARD_IMAGE_QUALITY}
      sizes={HERO_POSTER_SIZES}
      className="object-cover object-center"
    />
  );
}
