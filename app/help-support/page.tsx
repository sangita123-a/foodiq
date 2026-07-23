"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportHeader from "@/components/support/SupportHeader";
import QuickHelpCards, { type QuickHelpAction } from "@/components/support/QuickHelpCards";
import FaqAccordion from "@/components/support/FaqAccordion";
import { HELP_SUPPORT_FAQS } from "@/lib/seo/faq";
import LiveChatCard from "@/components/support/LiveChatCard";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import RecentTickets, { type TicketType } from "@/components/support/RecentTickets";
import ContactInfo from "@/components/support/ContactInfo";
import LiveChatModal from "@/components/support/LiveChatModal";
import CallSupportModal from "@/components/support/CallSupportModal";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  fetchPayments,
  fetchSupportHistory,
  fetchUserOrders,
  type SupportHistoryItem,
} from "@/services/supportApi";
import { searchSupportWithLiveData, highlightParts } from "@/lib/support/searchContent";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const ACTION_ROUTES: Partial<Record<QuickHelpAction, string>> = {
  track: "/track-order",
  payments: "/payment-support",
  "order-problem": "/report-problem",
  email: "/email-support",
};

function formatTicketDate(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function supportHistoryFetcher() {
  return fetchSupportHistory();
}

export default function HelpSupportPage() {
  const router = useRouter();
  const hasToken = useAuthToken();
  const { settings } = useSiteSettings();

  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<QuickHelpAction | null>(null);

  const {
    data: history,
    error: historyError,
    isLoading: ticketsLoading,
    mutate: mutateHistory,
  } = useSWR(hasToken ? "/api/support/history" : null, supportHistoryFetcher);

  const { data: orders = [] } = useSWR(
    hasToken && query.trim() ? "/api/orders?support-search" : null,
    fetchUserOrders
  );
  const { data: payments = [] } = useSWR(
    hasToken && query.trim() ? "/api/payments?support-search" : null,
    fetchPayments
  );

  const tickets: TicketType[] = useMemo(
    () =>
      (history?.tickets || []).slice(0, 8).map((t: SupportHistoryItem) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        date: formatTicketDate(t.date),
        type: t.type,
        unread: t.unread,
      })),
    [history]
  );

  const ticketsError = historyError
    ? (historyError as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || "Failed to load ticket history"
    : null;

  const search = useMemo(
    () =>
      searchSupportWithLiveData(query, HELP_SUPPORT_FAQS, {
        tickets: history?.tickets || [],
        orders: orders as Array<{ id: string; restaurant_name?: string; status?: string }>,
        payments: Array.isArray(payments) ? payments : [],
        refunds: (history?.refunds || []) as Array<{
          id: string;
          status?: string;
          amount?: number;
          order_id?: string;
        }>,
      }),
    [query, history, orders, payments]
  );

  const requireAuth = useCallback(
    (action: QuickHelpAction, redirectTo?: string) => {
      const gated: QuickHelpAction[] = ["track", "payments", "order-problem", "live-chat", "email"];
      if (gated.includes(action) && !hasToken) {
        const dest = redirectTo || ACTION_ROUTES[action] || "/help-support";
        router.push(`/login?redirect=${encodeURIComponent(dest)}`);
        return false;
      }
      return true;
    },
    [hasToken, router]
  );

  const openAction = useCallback(
    (action: QuickHelpAction) => {
      if (action === "call") {
        const isMobile =
          typeof window !== "undefined" &&
          window.matchMedia("(max-width: 768px)").matches;
        if (isMobile) {
          const phone = (settings.support_phone || "").replace(/[^\d+]/g, "");
          if (phone) {
            window.location.href = `tel:${phone}`;
            return;
          }
        }
        setModal("call");
        return;
      }

      const route = ACTION_ROUTES[action];
      if (!requireAuth(action, route)) return;

      if (route) {
        router.push(route);
        return;
      }

      setModal(action);
    },
    [requireAuth, router, settings.support_phone]
  );

  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl">
        <SupportHeader
          query={query}
          onQueryChange={setQuery}
          onSearch={() => {
            document.getElementById("support-search-results")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        />

        <QuickHelpCards onAction={openAction} />

        <div id="support-search-results">
          {query.trim() && search.articles.length > 0 ? (
            <div className="mb-10 rounded-3xl border border-border bg-section p-6 md:p-8">
              <h2 className="mb-4 text-xl font-bold text-foreground">Search results</h2>
              <ul className="space-y-3">
                {search.articles.map((article) => {
                  const href = "href" in article ? article.href : undefined;
                  const inner = (
                    <>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                        {article.category}
                      </p>
                      <h3 className="font-bold text-foreground">
                        {highlightParts(article.title, query).map((p, i) =>
                          p.hit ? (
                            <mark key={i} className="rounded bg-primary/20 px-0.5">
                              {p.text}
                            </mark>
                          ) : (
                            <span key={i}>{p.text}</span>
                          )
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-gray-text">
                        {highlightParts(article.body, query).map((p, i) =>
                          p.hit ? (
                            <mark key={i} className="rounded bg-primary/20 px-0.5">
                              {p.text}
                            </mark>
                          ) : (
                            <span key={i}>{p.text}</span>
                          )
                        )}
                      </p>
                    </>
                  );
                  return (
                    <li key={article.id} className="rounded-2xl border border-border bg-white p-4">
                      {href ? (
                        <Link href={href} className="block hover:opacity-90">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <FaqAccordion faqs={search.faqs} highlightQuery={query} />
            <SupportTicketForm />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="h-[300px]">
              <LiveChatCard onStart={() => openAction("live-chat")} />
            </div>
            <RecentTickets
              tickets={tickets}
              loading={ticketsLoading}
              error={ticketsError}
              onRetry={() => void mutateHistory()}
              requireLogin={!hasToken}
              onOpen={(t) => {
                if (t.type === "chat") openAction("live-chat");
                else if (t.type === "refund") openAction("payments");
                else if (t.type === "email") openAction("email");
                else openAction("order-problem");
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ContactInfo />
        </div>
      </div>

      <Footer />

      <LiveChatModal open={modal === "live-chat"} onClose={() => setModal(null)} />
      <CallSupportModal open={modal === "call"} onClose={() => setModal(null)} />
    </main>
  );
}
