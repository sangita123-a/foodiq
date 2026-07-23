import { HELP_SUPPORT_FAQS, type FaqEntry } from "@/lib/seo/faq";

export type SupportArticle = {
  id: string;
  title: string;
  body: string;
  category: "faq" | "refund" | "payments" | "orders" | "coupons" | "delivery" | "support";
  keywords: string[];
};

export type LiveSearchHit = {
  id: string;
  title: string;
  body: string;
  category: "orders" | "payments" | "refund" | "support";
  href?: string;
};

/** Searchable knowledge base used by Help & Support search. */
export const SUPPORT_ARTICLES: SupportArticle[] = [
  ...HELP_SUPPORT_FAQS.map((f) => ({
    id: `faq-${f.id}`,
    title: f.question,
    body: f.answer,
    category: "faq" as const,
    keywords: ["faq", ...f.question.toLowerCase().split(/\s+/)],
  })),
  {
    id: "refund-1",
    title: "How to request a refund",
    body: "Open Payment Issues from Help & Support, select the failed or cancelled order payment, then check Refund Status. Refunds for UPI/wallets typically arrive in 2–4 hours; cards may take 5–7 business days.",
    category: "refund",
    keywords: ["refund", "money back", "cancelled"],
  },
  {
    id: "payments-1",
    title: "Payment failed — what next?",
    body: "If a payment fails, no amount is deducted permanently. Use Retry Payment under Payment Issues or place the order again. Check your bank/UPI app for pending authorizations.",
    category: "payments",
    keywords: ["payment", "failed", "upi", "card", "retry"],
  },
  {
    id: "orders-1",
    title: "Track my order",
    body: "Use Track an Order on this page and enter your Order ID. You will see restaurant name, items, timeline from Placed to Delivered, and estimated delivery time.",
    category: "orders",
    keywords: ["track", "order", "status", "delivery"],
  },
  {
    id: "coupons-1",
    title: "Coupons not applying",
    body: "Coupons must meet minimum order value and restaurant eligibility. Expired or already-used codes will not apply. Remove conflicting offers and try again at checkout.",
    category: "coupons",
    keywords: ["coupon", "promo", "discount", "code"],
  },
  {
    id: "delivery-1",
    title: "How long does delivery take?",
    body: "Most Foodiq deliveries arrive within 30–45 minutes depending on distance, restaurant prep time, and traffic. Live ETA updates appear on order tracking.",
    category: "delivery",
    keywords: ["delivery", "eta", "time", "late"],
  },
  {
    id: "support-1",
    title: "How to contact support",
    body: "Use Live Chat for urgent issues, Call Support for phone help, or Email Support for detailed queries. Logged-in users can also raise order problem tickets with photos.",
    category: "support",
    keywords: ["support", "contact", "chat", "call", "email"],
  },
];

function tokenize(query: string) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesTokens(text: string, tokens: string[], keywords: string[] = []) {
  if (!tokens.length) return true;
  const hay = `${text} ${keywords.join(" ")}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export function searchSupportContent(query: string, faqs: FaqEntry[] = HELP_SUPPORT_FAQS) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      faqs,
      articles: SUPPORT_ARTICLES as Array<SupportArticle | LiveSearchHit>,
      query: "",
    };
  }

  const tokens = tokenize(q);

  return {
    query: q,
    faqs: faqs.filter((f) => matchesTokens(`${f.question} ${f.answer}`, tokens)),
    articles: SUPPORT_ARTICLES.filter((a) =>
      matchesTokens(`${a.title} ${a.body} ${a.category}`, tokens, a.keywords)
    ) as Array<SupportArticle | LiveSearchHit>,
  };
}

/** Merge KB search with live orders, payments, refunds, and tickets. */
export function searchSupportWithLiveData(
  query: string,
  faqs: FaqEntry[],
  live: {
    tickets?: Array<{ id: string; subject: string; status: string; type: string; date: string }>;
    orders?: Array<{ id: string; restaurant_name?: string; status?: string }>;
    payments?: Array<{ id: string; amount?: number; status?: string; method?: string; order_id?: string }>;
    refunds?: Array<{ id: string; status?: string; amount?: number; order_id?: string }>;
  } = {}
) {
  const base = searchSupportContent(query, faqs);
  const q = query.trim().toLowerCase();
  if (!q) return base;

  const tokens = tokenize(q);
  const liveHits: LiveSearchHit[] = [];

  for (const o of live.orders || []) {
    const text = `${o.id} ${o.restaurant_name || ""} ${o.status || ""} order`;
    if (matchesTokens(text, tokens, ["order", "track"])) {
      liveHits.push({
        id: `order-${o.id}`,
        title: `Order #${String(o.id).slice(0, 8).toUpperCase()}`,
        body: `${o.restaurant_name || "Restaurant"} · Status: ${o.status || "—"}`,
        category: "orders",
        href: `/track-order/${encodeURIComponent(o.id)}`,
      });
    }
  }

  for (const p of live.payments || []) {
    const text = `${p.id} ${p.status || ""} ${p.method || ""} ${p.order_id || ""} ${p.amount ?? ""} payment`;
    if (matchesTokens(text, tokens, ["payment", "invoice", "retry"])) {
      liveHits.push({
        id: `payment-${p.id}`,
        title: `Payment ${String(p.id).slice(0, 8).toUpperCase()}`,
        body: `₹${Number(p.amount || 0).toLocaleString("en-IN")} · ${p.method || "Payment"} · ${p.status || "—"}`,
        category: "payments",
        href: "/payment-support",
      });
    }
  }

  for (const r of live.refunds || []) {
    const text = `${r.id} ${r.status || ""} ${r.order_id || ""} ${r.amount ?? ""} refund`;
    if (matchesTokens(text, tokens, ["refund"])) {
      liveHits.push({
        id: `refund-${r.id}`,
        title: `Refund ${String(r.id).slice(0, 8).toUpperCase()}`,
        body: `₹${Number(r.amount || 0).toLocaleString("en-IN")} · Status: ${r.status || "—"}`,
        category: "refund",
        href: "/payment-support",
      });
    }
  }

  for (const t of live.tickets || []) {
    const text = `${t.id} ${t.subject} ${t.status} ${t.type} ticket support`;
    if (matchesTokens(text, tokens, ["ticket", "support", "complaint"])) {
      liveHits.push({
        id: `ticket-${t.id}`,
        title: t.subject,
        body: `${t.status} · ${t.type} · ${t.date}`,
        category: "support",
        href:
          t.type === "refund"
            ? "/payment-support"
            : t.type === "email"
              ? "/email-support"
              : "/report-problem",
      });
    }
  }

  return {
    ...base,
    articles: [...liveHits, ...base.articles],
  };
}

/** Wrap matching keywords in <mark> for display (returns React-safe parts). */
export function highlightParts(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(re);
  return parts.filter(Boolean).map((part) => ({
    text: part,
    hit: part.toLowerCase() === q.toLowerCase(),
  }));
}
