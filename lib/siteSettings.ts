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
  support_phone: "+91 1800 123 4567",
  whatsapp_number: "+91 9876543210",
  office_address: "123 Culinary Avenue, Tech Park, Hyderabad, India 500081",
  business_hours: "Mon - Sun: 24/7 Support",
  website_url: "https://foodiq.com",
  theme_color: "#E23744",
  footer_content:
    "Discover amazing restaurants and delicious food delivered straight to your doorstep.",
  delivery_charge: 35,
  free_delivery_min: 499,
  tax_percent: 5,
};

export function mergeSiteSettings(partial?: Partial<SiteSettings> | null): SiteSettings {
  return { ...DEFAULT_SITE_SETTINGS, ...(partial || {}) };
}
