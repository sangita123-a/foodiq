"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FOOD_IMAGE,
  DEFAULT_RESTAURANT_IMAGE,
  resolveBackendUrl,
} from "@/lib/images";
import { CARD_IMAGE_QUALITY, CARD_IMAGE_SIZES } from "@/lib/performance/assets";

type SafeImageProps = Omit<ImageProps, "src" | "alt" | "onError" | "decoding"> & {
  src?: string | null;
  fallback: string;
  /** Accessible description. Required for meaningful images; use decorative for UI chrome. */
  alt?: string;
  decorative?: boolean;
};

const DEFAULT_DIMENSIONS = { width: 384, height: 288 } as const;

function resolveSrc(src: string | null | undefined, fallback: string) {
  const value = typeof src === "string" ? src.trim() : "";
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return resolveBackendUrl(value) || fallback;
  }
  return value;
}

function pickUltimateFallback(fallback: string): string {
  const lower = fallback.toLowerCase();
  if (
    lower.includes("restaurant") ||
    lower.includes("logo") ||
    lower.includes("default-restaurant")
  ) {
    return DEFAULT_RESTAURANT_IMAGE;
  }
  return DEFAULT_FOOD_IMAGE;
}

function withObjectCover(className?: string) {
  const base = "object-cover object-center";
  if (!className) return base;
  if (className.includes("object-contain") || className.includes("object-fill")) {
    return className;
  }
  if (className.includes("object-cover")) return className;
  return `${base} ${className}`;
}

function shouldSkipOptimization(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:");
}

export default function SafeImage({
  src,
  fallback,
  alt,
  decorative = false,
  className,
  fill,
  width,
  height,
  sizes = CARD_IMAGE_SIZES,
  priority,
  loading = "lazy",
  quality = CARD_IMAGE_QUALITY,
  ...props
}: SafeImageProps) {
  const resolved = resolveSrc(src, fallback);
  const ultimate = pickUltimateFallback(fallback);
  const [activeSrc, setActiveSrc] = useState(resolved);

  useEffect(() => {
    setActiveSrc(resolveSrc(src, fallback));
  }, [src, fallback]);

  const resolvedAlt = decorative
    ? ""
    : (alt && alt.trim()) || "Foodiq food image";

  const useFill = fill === true || (width == null && height == null);
  const imgWidth = width ?? DEFAULT_DIMENSIONS.width;
  const imgHeight = height ?? DEFAULT_DIMENSIONS.height;
  const mergedClassName = withObjectCover(className);

  const unoptimized =
    shouldSkipOptimization(activeSrc) || props.unoptimized === true;

  const handleError = useCallback(() => {
    setActiveSrc((current) => {
      if (current === ultimate) return ultimate;
      if (current === fallback) return ultimate;
      if (current === resolved) return fallback;
      return ultimate;
    });
  }, [fallback, resolved, ultimate]);

  const common = {
    ...props,
    src: activeSrc,
    alt: resolvedAlt,
    sizes,
    priority,
    quality,
    loading: priority ? undefined : loading,
    decoding: "async" as const,
    unoptimized,
    className: mergedClassName,
    onError: handleError,
    style: {
      ...(props.style as object | undefined),
      backgroundColor: "#F8F8F8",
    },
  };

  if (useFill) {
    return <Image {...common} fill />;
  }

  return <Image {...common} width={imgWidth} height={imgHeight} />;
}
