const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

function normalizeWebsite(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidWebsite(url) {
  try {
    const normalized = normalizeWebsite(url);
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateContactInfo(body = {}) {
  const errors = [];
  const office_address = String(body.office_address || '').trim();
  const phone_number = String(body.phone_number || body.support_phone || '').trim();
  const email = String(body.email || body.support_email || '').trim();
  const business_hours = String(body.business_hours || '').trim();
  const websiteRaw = String(body.website || body.website_url || '').trim();
  const whatsapp_number = String(body.whatsapp_number || '').trim();

  if (!office_address) errors.push('Office address is required');
  if (!phone_number) errors.push('Phone number is required');
  else if (!PHONE_RE.test(phone_number)) errors.push('Phone number format is invalid');
  if (!email) errors.push('Email address is required');
  else if (!EMAIL_RE.test(email)) errors.push('Email address format is invalid');
  if (!business_hours) errors.push('Business hours are required');
  if (!websiteRaw) errors.push('Website is required');
  else if (!isValidWebsite(websiteRaw)) errors.push('Website URL format is invalid');
  if (!whatsapp_number) errors.push('WhatsApp number is required');
  else if (!PHONE_RE.test(whatsapp_number)) errors.push('WhatsApp number format is invalid');

  return {
    valid: errors.length === 0,
    errors,
    data: {
      office_address,
      phone_number,
      email,
      business_hours,
      website: normalizeWebsite(websiteRaw),
      whatsapp_number,
    },
  };
}

module.exports = {
  validateContactInfo,
  normalizeWebsite,
};
