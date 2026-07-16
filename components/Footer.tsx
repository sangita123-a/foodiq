import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black py-12 border-t border-white/10 mt-20">
      <div className="container mx-auto px-8 lg:px-16 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center text-3xl font-bold tracking-tight">
            <span className="text-white">Food</span>
            <span className="text-[var(--color-primary)]">iq</span>
          </div>
          <p className="text-[var(--color-gray-text)] mt-2 text-sm">
            Discover amazing restaurants and delicious food delivered straight to your doorstep.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-[var(--color-gray-text)]">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          <Link href="/help-support" className="hover:text-white transition-colors">Support</Link>
        </div>
      </div>
      <div className="text-center text-[var(--color-gray-text)] text-xs mt-12 opacity-50">
        &copy; {new Date().getFullYear()} Foodiq. All rights reserved.
      </div>
    </footer>
  );
}
