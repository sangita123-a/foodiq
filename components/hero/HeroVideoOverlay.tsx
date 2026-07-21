"use client";

import { useEffect, useState } from "react";
import { HERO_POSTER_WEBP, HERO_VIDEO } from "@/lib/performance/assets";
import { scheduleIdleWork, shouldLoadHeroVideo } from "@/lib/performance/media";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

/** Desktop-only hero video overlay — poster stays server-rendered underneath. */
export default function HeroVideoOverlay() {
  const [showVideo, setShowVideo] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!shouldLoadHeroVideo()) return;
    return scheduleIdleWork(() => setShowVideo(true), 3500);
  }, []);

  if (!showVideo || prefersReduced) return null;

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster={HERO_POSTER_WEBP}
      aria-label="Foodiq hero background showing food delivery atmosphere"
      className="absolute inset-0 z-[1] h-full w-full object-cover object-center transform-gpu scale-[1.01]"
    >
      <source src={HERO_VIDEO} type="video/mp4" />
    </video>
  );
}
