import { redirect } from "next/navigation";
import { CANONICAL_PATHS } from "@/lib/seo/urls";

export default function PopularRestaurantsRedirectPage() {
  redirect(CANONICAL_PATHS.orderOnline);
}
