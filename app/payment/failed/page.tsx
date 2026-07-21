import { Suspense } from "react";
import PaymentFailedPage from "./PaymentFailedClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-section pt-[90px] flex items-center justify-center text-gray-text">
          Loading...
        </main>
      }
    >
      <PaymentFailedPage />
    </Suspense>
  );
}
