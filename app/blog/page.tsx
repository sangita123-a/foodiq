import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const posts = [
  {
    title: "How Foodiq Partners with Local Restaurants",
    excerpt:
      "Discover how we help neighbourhood favourites reach more customers online.",
    date: "June 2026",
  },
  {
    title: "Top 10 Trending Dishes This Season",
    excerpt:
      "From biryanis to gourmet burgers — see what India is ordering right now.",
    date: "May 2026",
  },
  {
    title: "Tips for Faster, Fresher Deliveries",
    excerpt:
      "Behind the scenes on how we keep your food hot and on time.",
    date: "April 2026",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background pt-[90px]">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-12 md:px-8">
        <h1 className="mb-2 text-3xl font-black text-foreground md:text-4xl">
          Foodiq Blog
        </h1>
        <p className="mb-10 text-[#555555]">
          Stories, tips, and updates from the Foodiq team.
        </p>
        <ul className="space-y-6">
          {posts.map((post) => (
            <li
              key={post.title}
              className="rounded-2xl border border-border p-6 shadow-sm"
            >
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#737373]">
                {post.date}
              </p>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                {post.title}
              </h2>
              <p className="text-[#555555]">{post.excerpt}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-[#555555]">
          Press inquiries? Visit our{" "}
          <Link href="/press" className="text-primary hover:underline">
            Press page
          </Link>
          .
        </p>
      </div>
      <Footer />
    </main>
  );
}
