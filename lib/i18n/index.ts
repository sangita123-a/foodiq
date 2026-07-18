/** Lightweight i18n catalogs — no layout redesign. */
export type LocaleCode = "en" | "hi" | "ar";

const catalogs: Record<LocaleCode, Record<string, string>> = {
  en: {
    "app.name": "Foodiq",
    "cart.empty": "Your cart is empty",
    "checkout.place_order": "Place order",
    "support.hello": "How can we help you today?",
  },
  hi: {
    "app.name": "Foodiq",
    "cart.empty": "आपकी कार्ट खाली है",
    "checkout.place_order": "ऑर्डर करें",
    "support.hello": "आज हम आपकी कैसे मदद कर सकते हैं?",
  },
  ar: {
    "app.name": "Foodiq",
    "cart.empty": "سلة التسوق فارغة",
    "checkout.place_order": "قدّم الطلب",
    "support.hello": "كيف يمكننا مساعدتك اليوم؟",
  },
};

export function normalizeLocale(raw?: string | null): LocaleCode {
  if (!raw) return "en";
  const base = String(raw).toLowerCase().split(/[-_]/)[0];
  return (catalogs as Record<string, unknown>)[base] ? (base as LocaleCode) : "en";
}

export function t(locale: string | undefined, key: string, fallback?: string): string {
  const code = normalizeLocale(locale);
  return catalogs[code][key] || fallback || key;
}

export function getCatalog(locale?: string) {
  const code = normalizeLocale(locale);
  return {
    locale: code,
    direction: code === "ar" ? ("rtl" as const) : ("ltr" as const),
    messages: catalogs[code],
  };
}

export function formatInTimezone(
  date: Date | string | number,
  timeZone = "Asia/Kolkata",
  locale = "en-IN"
): string {
  const d = date instanceof Date ? date : new Date(date);
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}
