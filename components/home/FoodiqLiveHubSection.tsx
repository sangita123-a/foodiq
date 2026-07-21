"use client";

import { useEffect, useState } from "react";
import FoodiqLiveHub from "@/components/FoodiqLiveHub";

function SectionSkeleton() {
  return (
    <div
      className="mx-auto my-8 h-56 max-w-7xl animate-pulse rounded-2xl bg-[#FAFAFA]"
      aria-hidden
    />
  );
}

export default function FoodiqLiveHubSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <SectionSkeleton />;
  }

  return <FoodiqLiveHub />;
}
