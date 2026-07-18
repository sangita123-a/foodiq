const CATALOGS = {
  en: {
    'app.name': 'Foodiq',
    'cart.empty': 'Your cart is empty',
    'checkout.place_order': 'Place order',
    'support.hello': 'How can we help you today?',
  },
  hi: {
    'app.name': 'Foodiq',
    'cart.empty': 'आपकी कार्ट खाली है',
    'checkout.place_order': 'ऑर्डर करें',
    'support.hello': 'आज हम आपकी कैसे मदद कर सकते हैं?',
  },
  ar: {
    'app.name': 'Foodiq',
    'cart.empty': 'سلة التسوق فارغة',
    'checkout.place_order': 'قدّم الطلب',
    'support.hello': 'كيف يمكننا مساعدتك اليوم؟',
  },
};

const normalizeLocale = (raw) => {
  if (!raw) return 'en';
  const base = String(raw).toLowerCase().split(/[-_]/)[0];
  return CATALOGS[base] ? base : 'en';
};

const getMessages = (locale) => {
  const code = normalizeLocale(locale);
  return { locale: code, direction: code === 'ar' ? 'rtl' : 'ltr', messages: CATALOGS[code] };
};

const t = (locale, key, fallback) => {
  const cat = CATALOGS[normalizeLocale(locale)] || CATALOGS.en;
  return cat[key] || fallback || key;
};

const formatInTimezone = (date, timeZone = 'Asia/Kolkata', locale = 'en-IN') => {
  const d = date instanceof Date ? date : new Date(date);
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toISOString();
  }
};

module.exports = { CATALOGS, normalizeLocale, getMessages, t, formatInTimezone };
