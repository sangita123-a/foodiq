"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Props = {
  children: (props: { onClose: () => void }) => React.ReactNode;
  backHref?: string;
};

/** Shared chrome for support destination pages — preserves Help & Support visual language. */
export default function SupportFlowPage({ children, backHref = "/help-support" }: Props) {
  const router = useRouter();
  const onClose = () => router.push(backHref);

  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-12 md:px-8">{children({ onClose })}</div>
      <Footer />
    </main>
  );
}
