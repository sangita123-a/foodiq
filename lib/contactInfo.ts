export type ContactInfo = {
  office_address: string;
  phone_number: string;
  email: string;
  business_hours: string;
  website: string;
  whatsapp_number: string;
};

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  office_address: "123 Culinary Avenue, Tech Park, Hyderabad, India 500081",
  phone_number: "+91 6371115043",
  email: "ssangitasahoo48@gmail.com",
  business_hours: "Mon - Sun: 24/7 Support",
  website: "https://foodiq.com",
  whatsapp_number: "+91 6371115043",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidWebsite(url: string): boolean {
  try {
    const normalized = normalizeWebsite(url);
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function mergeContactInfo(partial?: Partial<ContactInfo> | null): ContactInfo {
  return { ...DEFAULT_CONTACT_INFO, ...(partial || {}) };
}

export function validateContactInfoForm(data: ContactInfo): string[] {
  const errors: string[] = [];

  if (!data.office_address.trim()) errors.push("Office address is required");
  if (!data.phone_number.trim()) errors.push("Phone number is required");
  else if (!PHONE_RE.test(data.phone_number.trim())) errors.push("Phone number format is invalid");
  if (!data.email.trim()) errors.push("Email address is required");
  else if (!EMAIL_RE.test(data.email.trim())) errors.push("Email address format is invalid");
  if (!data.business_hours.trim()) errors.push("Business hours are required");
  if (!data.website.trim()) errors.push("Website is required");
  else if (!isValidWebsite(data.website)) errors.push("Website URL format is invalid");
  if (!data.whatsapp_number.trim()) errors.push("WhatsApp number is required");
  else if (!PHONE_RE.test(data.whatsapp_number.trim())) errors.push("WhatsApp number format is invalid");

  return errors;
}

export const CONTACT_INFO_SWR_KEY = "contact-info";
