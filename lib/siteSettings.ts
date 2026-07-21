export type SiteSettings = {
  app_name: string;
  company_name: string;
  logo_url?: string;
  support_email: string;
  support_phone: string;
  whatsapp_number?: string;
  office_address: string;
  google_maps_embed_url?: string;
  business_hours: string;
  website_url: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  google_play_url?: string;
  app_store_url?: string;
  theme_color: string;
  footer_content?: string;
  privacy_policy_text?: string;
  terms_of_service_text?: string;
  delivery_charge?: number;
  free_delivery_min?: number;
  tax_percent?: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  app_name: "Foodiq",
  company_name: "Foodiq",
  support_email: "support@foodiq.com",
  support_phone: "+91 1800 000 000",
  whatsapp_number: "+91 9876543210",
  office_address: "123 Culinary Avenue, Tech Park, Hyderabad, India 500081",
  business_hours: "Mon - Sun: 24/7 Support",
  website_url: "https://foodiq.com",
  facebook_url: "https://facebook.com/foodiq",
  instagram_url: "https://instagram.com/foodiq",
  twitter_url: "https://twitter.com/foodiq",
  linkedin_url: "https://linkedin.com/company/foodiq",
  youtube_url: "https://youtube.com/@foodiq",
  google_play_url:
    "https://play.google.com/store/apps/details?id=com.foodiq.app",
  app_store_url: "https://apps.apple.com/app/foodiq/id6470000000",
  theme_color: "#0F766E",
  footer_content:
    "Discover amazing restaurants and delicious food delivered straight to your doorstep.",
  delivery_charge: 35,
  free_delivery_min: 499,
  tax_percent: 5,
};

export function mergeSiteSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  return { ...DEFAULT_SITE_SETTINGS, ...(partial || {}) };
}
