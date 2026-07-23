/**
 * Indian mobile helpers shared by auth flows.
 */

export function normalizeIndianMobile(phone: string): string {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits;
}

export function isValidIndianMobile(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(phone));
}

export function toE164Indian(phone: string): string {
  return `+91${normalizeIndianMobile(phone)}`;
}

export function validateIndianMobile(phone: string): string | null {
  const value = String(phone || "").trim();
  if (!value) return "Mobile number is required";
  if (!isValidIndianMobile(value)) {
    return "Enter a valid 10-digit Indian mobile number";
  }
  return null;
}
