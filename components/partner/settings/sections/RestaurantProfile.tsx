"use client";

import { Store } from "lucide-react";
import { SettingsState } from "../types";
import MediaUploader from "@/components/media/MediaUploader";
import { RESTAURANT_FALLBACK } from "@/lib/images";

interface RestaurantProfileProps {
  data: SettingsState["profile"];
  onChange: (data: Partial<SettingsState["profile"]>) => void;
}

export default function RestaurantProfile({ data, onChange }: RestaurantProfileProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground flex items-center gap-2 mb-2">
          <Store className="w-6 h-6 text-primary" /> Restaurant Profile
        </h2>
        <p className="text-gray-text text-sm mb-6">Manage your public restaurant identity.</p>
      </div>

      <div className="space-y-6">
        <MediaUploader
          purpose="restaurant_banner"
          value={data.cover}
          label="Cover / Banner"
          hint="1200 × 400 recommended"
          aspect="wide"
          fallback={RESTAURANT_FALLBACK}
          onUploaded={(asset) => onChange({ cover: asset.url })}
          onClear={() => onChange({ cover: "" })}
        />

        <div className="flex flex-col sm:flex-row items-start gap-6">
          <MediaUploader
            purpose="restaurant_logo"
            value={data.logo}
            label="Logo"
            hint="Square 500×500"
            aspect="square"
            className="w-40"
            fallback={RESTAURANT_FALLBACK}
            onUploaded={(asset) => onChange({ logo: asset.url })}
            onClear={() => onChange({ logo: "" })}
          />
          <div className="pt-6">
            <h4 className="text-foreground font-bold mb-1">Restaurant Logo</h4>
            <p className="text-gray-text text-sm">
              Uploads go to cloud storage (Cloudinary or S3) with CDN delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-section"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">
            Restaurant Name
          </label>
          <input
            type="text"
            value={data.restaurantName}
            onChange={(e) => onChange({ restaurantName: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">
            Owner Name
          </label>
          <input
            type="text"
            value={data.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm resize-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-text uppercase tracking-wider mb-2">
            Cuisine Types
          </label>
          <input
            type="text"
            value={data.cuisineType}
            onChange={(e) => onChange({ cuisineType: e.target.value })}
            placeholder="Indian, Chinese, Fast Food"
            className="w-full bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
        </div>
      </div>
    </div>
  );
}
