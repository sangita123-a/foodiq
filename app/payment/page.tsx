import { Suspense } from "react";
import PaymentRetryClient from "./PaymentRetryClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-section pt-[90px] flex items-center justify-center text-gray-text">
          Loading payment...
        </main>
      }
    >
      <PaymentRetryClient />
    </Suspense>
  );
}
