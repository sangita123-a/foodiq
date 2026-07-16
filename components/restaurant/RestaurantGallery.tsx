"use client";

import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

type RestaurantGalleryProps = {
  images: string[];
};

export default function RestaurantGallery({ images }: RestaurantGalleryProps) {
  const galleryImages = images.filter(Boolean).slice(0, 4);
  if (galleryImages.length === 0) return null;

  return (
    <div className="container mx-auto px-4 md:px-8 mt-6">
      <h2 className="text-xl font-bold text-white mb-4">Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {galleryImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10"
          >
            <SafeImage
              src={image}
              fallback={FOOD_FALLBACK}
              alt={`Restaurant gallery ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
