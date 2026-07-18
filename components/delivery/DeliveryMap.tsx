"use client";

type DeliveryMapProps = {
  embedUrl?: string;
  directionsUrl?: string;
  distanceKm?: number | null;
  durationMin?: number | null;
  restaurantName?: string;
  customerAddress?: string;
};

export default function DeliveryMap({
  embedUrl,
  directionsUrl,
  distanceKm,
  durationMin,
  restaurantName,
  customerAddress,
}: DeliveryMapProps) {
  const fallback =
    "https://www.openstreetmap.org/export/embed.html?bbox=77.57%2C12.96%2C77.62%2C12.99&layer=mapnik";

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-[#111827]">Route Map</p>
          <p className="text-xs text-[#6B7280]">
            {restaurantName || "Restaurant"} → {customerAddress || "Customer"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm font-bold">
          {distanceKm != null && (
            <span className="px-3 py-1 rounded-lg bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB]">
              {distanceKm} km
            </span>
          )}
          {durationMin != null && (
            <span className="px-3 py-1 rounded-lg bg-[#FC8019]/10 text-[#FC8019] border border-[#FC8019]/20">
              ~{durationMin} min
            </span>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg bg-[#FC8019] text-white hover:bg-[#E66F0D]"
            >
              Navigate
            </a>
          )}
        </div>
      </div>
      <iframe
        title="Delivery route map"
        src={embedUrl || fallback}
        className="w-full h-72 md:h-96 border-0"
        loading="lazy"
      />
      <p className="px-4 py-2 text-[11px] text-[#9CA3AF]">
        Powered by OpenStreetMap · Routing via OSRM
      </p>
    </div>
  );
}
