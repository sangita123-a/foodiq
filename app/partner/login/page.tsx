import PartnerHero from "@/components/partner/PartnerHero";
import PartnerLoginForm from "@/components/partner/PartnerLoginForm";

export default function PartnerLoginPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] selection:bg-[#E23744] selection:text-white flex flex-col lg:flex-row">
      
      {/* Left Side: Hero & Features (50%) */}
      <div className="w-full lg:w-1/2">
        <PartnerHero />
      </div>

      {/* Right Side: Login Form (50%) */}
      <div className="w-full lg:w-1/2">
        <PartnerLoginForm />
      </div>

    </main>
  );
}
