"use client";

import Link from "next/link";
import useSWR from "swr";
import { getAccessToken } from "@/lib/accessToken";
import { useFeatureFlag } from "@/lib/featureFlags";
import {
  fetchPersonalizedHome,
  fetchRecentlyViewed,
} from "@/services/featuresApi";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

/**
 * Additive personalized rails for the home page — only renders when data exists.
 * Preserves existing Foodiq section styling (no redesign).
 */
export default function PersonalizedHomeRails() {
  const personalizedOn = useFeatureFlag("personalized_home", true);
  const recentOn = useFeatureFlag("recently_viewed", true);
  const token = typeof window !== "undefined" ? getAccessToken() : null;

  const { data: feed } = useSWR(
    personalizedOn ? ["features-home", !!token] : null,
    () => fetchPersonalizedHome()
  );
  const { data: recent } = useSWR(
    recentOn && token ? "features-recent" : null,
    () => fetchRecentlyViewed()
  );

  if (!personalizedOn) return null;

  const restaurants =
    (feed?.recommendations?.restaurants as Array<Record<string, unknown>>) ||
    [];
  const dishes =
    (feed?.recommendations?.dishes as Array<Record<string, unknown>>) || [];
  const campaigns =
    (feed?.campaigns as Array<Record<string, unknown>>) || [];
  const recentItems = (recent as Array<Record<string, unknown>>) || [];

  if (
    !restaurants.length &&
    !dishes.length &&
    !campaigns.length &&
    !recentItems.length
  ) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {campaigns[0] ? (
        <div className="rounded-2xl bg-gradient-to-r from-[#E23744]/15 to-[#E23744]/5 border border-[#E5E7EB] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#E23744]">
            Seasonal
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-[#111827] mt-1">
            {String(campaigns[0].title)}
          </h2>
          {campaigns[0].subtitle ? (
            <p className="text-sm text-[#6B7280] mt-1">
              {String(campaigns[0].subtitle)}
            </p>
          ) : null}
          {campaigns[0].offer_code ? (
            <p className="mt-3 text-sm font-bold text-[#111827]">
              Code: {String(campaigns[0].offer_code)}
            </p>
          ) : null}
        </div>
      ) : null}

      {token && restaurants.length > 0 ? (
        <div>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
              Recommended for you
            </h2>
            <Link
              href="/restaurants"
              className="text-sm font-bold text-[#E23744]"
            >
              See all
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {restaurants.slice(0, 8).map((r) => (
              <Link
                key={String(r.id)}
                href={`/restaurant/${r.id}`}
                className="min-w-[160px] max-w-[180px] shrink-0"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F8F9FA]">
                  <SafeImage
                    src={String(r.image_url || RESTAURANT_FALLBACK)}
                    fallback={RESTAURANT_FALLBACK}
                    alt={String(r.name)}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-sm font-bold text-[#111827] line-clamp-1">
                  {String(r.name)}
                </p>
                {r.rating != null ? (
                  <p className="text-xs text-[#6B7280]">★ {String(r.rating)}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {dishes.length > 0 ? (
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111827] mb-4">
            Dishes you may like
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {dishes.slice(0, 8).map((d) => (
              <div key={String(d.id)} className="min-w-[140px] shrink-0">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F9FA]">
                  <SafeImage
                    src={String(d.image_url || RESTAURANT_FALLBACK)}
                    fallback={RESTAURANT_FALLBACK}
                    alt={String(d.name)}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-sm font-bold text-[#111827] line-clamp-1">
                  {String(d.name)}
                </p>
                <p className="text-xs text-[#6B7280] line-clamp-1">
                  {String(d.restaurant_name || "")}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recentItems.length > 0 ? (
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111827] mb-4">
            Recently viewed
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentItems.slice(0, 8).map((item, idx) => (
              <Link
                key={`${item.item_id}-${idx}`}
                href={
                  item.item_type === "restaurant"
                    ? `/restaurant/${item.item_id}`
                    : `/food/${item.item_id}`
                }
                className="min-w-[140px] shrink-0"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8F9FA]">
                  <SafeImage
                    src={String(item.image_url || RESTAURANT_FALLBACK)}
                    fallback={RESTAURANT_FALLBACK}
                    alt={String(item.name)}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-sm font-bold text-[#111827] line-clamp-1">
                  {String(item.name)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
