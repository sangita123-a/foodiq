import { Suspense } from "react";
import PaymentFailedPage from "./PaymentFailedClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8FAFC] pt-[90px] flex items-center justify-center text-[#6B7280]">
          Loading...
        </main>
      }
    >
      <PaymentFailedPage />
    </Suspense>
  );
}
