import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A1A1A] py-14 border-t border-[#262626] mt-20 text-white">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center text-3xl font-bold tracking-tight">
            <span className="text-white">Food</span>
            <span className="text-[#E23744]">iq</span>
          </div>
          <p className="text-[#A3A3A3] mt-2 text-sm max-w-md">
            Discover amazing restaurants and delicious food delivered straight to your doorstep.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-[#D4D4D4]">
          <Link href="/about" className="hover:text-[#E23744] transition-colors">About</Link>
          <Link href="/restaurants" className="hover:text-[#E23744] transition-colors">Restaurants</Link>
          <Link href="/privacy-policy" className="hover:text-[#E23744] transition-colors">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-[#E23744] transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-[#E23744] transition-colors">Contact Us</Link>
          <Link href="/help-support" className="hover:text-[#E23744] transition-colors">Support</Link>
        </div>
      </div>
      <div className="text-center text-[#737373] text-xs mt-12">
        &copy; {new Date().getFullYear()} Foodiq. All rights reserved.
      </div>
    </footer>
  );
}
