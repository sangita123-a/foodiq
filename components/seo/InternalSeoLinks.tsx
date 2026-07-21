import Link from "next/link";
import type { InternalLink } from "@/lib/seo/internal-links";

type InternalSeoLinksProps = {
  links: InternalLink[];
  label?: string;
};

/**
 * Screen-reader-only internal links for SEO. No visible UI change.
 */
export default function InternalSeoLinks({
  links,
  label = "Explore Foodiq",
}: InternalSeoLinksProps) {
  if (links.length === 0) return null;

  return (
    <nav aria-label={label} className="sr-only">
      <ul>
        {links.map(({ href, anchor }, index) => (
          <li key={`${anchor}-${index}`}>
            <Link href={href}>{anchor}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
