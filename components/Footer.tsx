"use client";

import { useEffect, useState } from "react";
import FooterContent from "./FooterContent";

function FooterPlaceholder() {
  return (
    <footer
      className="mt-12 w-full border-t border-border bg-footer py-10 sm:mt-16 sm:py-14 lg:mt-20"
      aria-hidden="true"
    >
      <div className="container mx-auto min-h-[320px] px-4 sm:px-6 lg:px-16" />
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
