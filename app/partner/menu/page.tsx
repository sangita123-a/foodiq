"use client";

import { useMemo } from "react";
import { mutate } from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import MenuHeader from "@/components/partner/menu/MenuHeader";
import MenuSummary from "@/components/partner/menu/MenuSummary";
import MenuBestSellers from "@/components/partner/menu/MenuBestSellers";
import MenuTable from "@/components/partner/menu/MenuTable";
import { usePartnerMenu } from "@/hooks/usePartnerData";
import {
  deletePartnerDish,
  updatePartnerDish,
  formatCurrency,
  formatRelativeTime,
  type PartnerMenuItem,
} from "@/services/partnerApi";
import { FOOD_FALLBACK } from "@/lib/images";

function mapStatus(item: PartnerMenuItem) {
  if (item.is_available === false) return "Out of Stock";
  return "Available";
}

function statusToPayload(status: string) {
  if (status === "Out of Stock" || status === "Hidden") {
    return { is_available: false };
  }
  return { is_available: true };
}

export default function PartnerMenuPage() {
  const { data, isLoading, error } = usePartnerMenu();
  const items = (data?.items || []) as PartnerMenuItem[];
  const categories = (data?.categories || []).map((c: { name: string }) => c.name);

  const tableDishes = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category_name || "Uncategorized",
        price: Number(item.price),
        rating: Number(item.rating || 0),
        status: mapStatus(item),
        orders: item.orders_count || 0,
        updated: formatRelativeTime(item.updated_at),
        image: item.image_url || FOOD_FALLBACK,
      })),
    [items]
  );

  const summary = useMemo(() => {
    const available = items.filter((i) => i.is_available !== false).length;
    const out = items.filter((i) => i.is_available === false).length;
    return {
      total: items.length,
      available,
      outOfStock: out,
      hidden: 0,
    };
  }, [items]);

  const bestSellers = useMemo(
    () =>
      [...items]
        .filter((i) => i.is_bestseller || (i.orders_count || 0) > 0)
        .sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0))
        .slice(0, 4)
        .map((i) => ({
          name: i.name,
          orders: i.orders_count || 0,
          revenue: formatCurrency(Number(i.price) * (i.orders_count || 0)),
          image: i.image_url || FOOD_FALLBACK,
        })),
    [items]
  );

  const refresh = () => mutate("/api/partner/menu");

  const handleStatusChange = async (id: string, status: string) => {
    await updatePartnerDish(id, statusToPayload(status));
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deletePartnerDish(id);
    refresh();
  };

  const handleBulkDelete = async (ids: string[]) => {
    await Promise.all(ids.map((id) => deletePartnerDish(id)));
    refresh();
  };

  const handleBulkStatus = async (ids: string[], status: string) => {
    const payload = statusToPayload(status);
    await Promise.all(ids.map((id) => updatePartnerDish(id, payload)));
    refresh();
  };

  return (
    <div className="min-h-screen bg-section flex selection:bg-primary selection:text-white">
      
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        <PartnerHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            <MenuHeader />

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Unable to load menu.
              </div>
            )}
            {isLoading && !items.length && (
              <p className="text-gray-text mb-4 text-sm">Loading menu…</p>
            )}
            
            <MenuSummary {...summary} />

            <MenuBestSellers bestSellers={bestSellers} />

            <MenuTable
              dishes={tableDishes}
              categories={categories}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onBulkStatus={handleBulkStatus}
            />

          </div>
        </main>
      </div>

    </div>
  );
}
