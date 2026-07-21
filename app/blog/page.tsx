import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { BLOG_THUMBNAILS } from "@/lib/data/sectionImages";

const posts = [
  {
    title: "How Foodiq Partners with Local Restaurants",
    excerpt:
      "Discover how we help neighbourhood favourites reach more customers online.",
    date: "June 2026",
    image: BLOG_THUMBNAILS[0],
  },
  {
    title: "Top 10 Trending Dishes This Season",
    excerpt:
      "From biryanis to gourmet burgers — see what India is ordering right now.",
    date: "May 2026",
    image: BLOG_THUMBNAILS[1],
  },
  {
    title: "Tips for Faster, Fresher Deliveries",
    excerpt:
      "Behind the scenes on how we keep your food hot and on time.",
    date: "April 2026",
    image: BLOG_THUMBNAILS[2],
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
        <p className="mb-10 text-gray-text">
          Stories, tips, and updates from the Foodiq team.
        </p>
        <ul className="space-y-6">
          {posts.map((post) => (
            <li
              key={post.title}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-card"
            >
              <div className="relative h-44 w-full bg-section">
                <SafeImage
                  src={post.image}
                  fallback={RESTAURANT_FALLBACK}
                  alt=""
                  decorative
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
                  {post.date}
                </p>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {post.title}
                </h2>
                <p className="text-gray-text">{post.excerpt}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-gray-text">
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
