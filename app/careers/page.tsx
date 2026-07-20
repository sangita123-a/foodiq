import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="mb-6 text-3xl font-black text-[#222222] md:text-4xl">
          Careers at Foodiq
        </h1>
        <div className="prose space-y-4 text-[#555555]">
          <p>
            Join our team and help millions discover great food. We are building
            India&apos;s most loved food delivery platform — from engineering and
            product to operations and customer success.
          </p>
          <h2 className="mt-8 text-xl font-bold text-[#111827]">Open Roles</h2>
          <p>
            We are hiring across engineering, design, marketing, and restaurant
            partnerships. Send your resume to{" "}
            <a
              href="mailto:careers@foodiq.com"
              className="text-[#E23744] hover:underline"
            >
              careers@foodiq.com
            </a>{" "}
            with the role you are interested in.
          </p>
          <p>
            <Link href="/about" className="text-[#E23744] hover:underline">
              Learn more about Foodiq
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
