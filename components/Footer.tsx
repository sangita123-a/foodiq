"use client";

import { useEffect, useState } from "react";
import FooterContent from "./FooterContent";

function FooterPlaceholder() {
  return (
    <footer
      className="mt-3 w-full border-t border-white/10 bg-[#1C1C1C] py-3 max-md:py-3 sm:mt-10 sm:py-8 lg:mt-14"
      aria-hidden="true"
    >
      <div className="container mx-auto min-h-[200px] px-3 sm:min-h-[240px] sm:px-6 lg:min-h-[260px] lg:px-16" />
    </footer>
  );
}

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <FooterPlaceholder />;
  }

  return <FooterContent />;
}
