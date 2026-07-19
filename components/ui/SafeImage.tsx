"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { resolveBackendUrl } from "@/lib/images";

type SafeImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src?: string | null;
  fallback: string;
  /** Accessible description. Required for meaningful images; use decorative for UI chrome. */
  alt?: string;
  decorative?: boolean;
};

function resolveSrc(src: string | null | undefined, fallback: string) {
  const value = typeof src === "string" ? src.trim() : "";
  if (!value) return fallback;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return resolveBackendUrl(value) || fallback;
  }
  return value;
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
  sizes = "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
  priority,
  loading = "lazy",
  ...props
}: SafeImageProps) {
  const resolved = resolveSrc(src, fallback);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const imgSrc = failedFor === resolved ? fallback : resolved;
  const resolvedAlt = decorative
    ? ""
    : (alt && alt.trim()) || "Foodiq food image";

  const useFill = fill === true || (width == null && height == null);
  const unoptimized =
    imgSrc.startsWith("data:") ||
    imgSrc.startsWith("blob:") ||
    props.unoptimized === true;

  const handleError = () => {
    if (resolved !== fallback) setFailedFor(resolved);
  };

  if (useFill) {
    return (
      <Image
        {...props}
        src={imgSrc}
        alt={resolvedAlt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        unoptimized={unoptimized}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={resolvedAlt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : loading}
      unoptimized={unoptimized}
      className={className}
      onError={handleError}
    />
  );
}
