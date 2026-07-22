"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_POSTER_WEBP, HERO_VIDEO } from "@/lib/performance/assets";
import { scheduleIdleWork, shouldLoadHeroVideo } from "@/lib/performance/media";
import { usePrefersReducedMotion, useIsMobile } from "@/hooks/useMediaQuery";

/** Hero video overlay — poster stays server-rendered underneath on all viewports. */
export default function HeroVideoOverlay() {
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const isMobile = useIsMobile(768);

  useEffect(() => {
    if (!shouldLoadHeroVideo()) return;
    const delayMs = isMobile ? 600 : 3500;
    return scheduleIdleWork(() => setShowVideo(true), delayMs);
  }, [isMobile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!showVideo || !video || prefersReduced) return;

    const tryPlay = () => {
      void video.play().catch(() => undefined);
    };

    tryPlay();
    video.addEventListener("loadeddata", tryPlay);
    return () => video.removeEventListener("loadeddata", tryPlay);
  }, [showVideo, prefersReduced]);

  if (!showVideo || prefersReduced) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload={isMobile ? "auto" : "metadata"}
      poster={HERO_POSTER_WEBP}
      aria-label="Foodiq hero background showing food delivery atmosphere"
      className="absolute inset-0 z-[1] h-full w-full object-cover object-center transform-gpu scale-[1.01]"
    >
      <source src={HERO_VIDEO} type="video/mp4" />
    </video>
  );
}
