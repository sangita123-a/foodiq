"use client";

import { useState, useEffect } from "react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback: string;
};

export default function SafeImage({
  src,
  fallback,
  alt = "",
  className,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallback);

  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
