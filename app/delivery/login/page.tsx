import DeliveryHero from "@/components/delivery/DeliveryHero";
import DeliveryLoginForm from "@/components/delivery/DeliveryLoginForm";

export default function DeliveryLoginPage() {
  return (
    <main className="min-h-screen bg-section selection:bg-primary selection:text-white flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2">
        <DeliveryHero />
      </div>
      <div className="w-full lg:w-1/2">
        <DeliveryLoginForm />
      </div>
    </main>
  );
}
