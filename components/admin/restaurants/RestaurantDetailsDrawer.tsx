"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  X,
  User,
  MapPin,
  Clock,
  Utensils,
  Image as ImageIcon,
  Star,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Ban,
  PlayCircle,
  Loader2,
  FileText,
  Landmark,
  Reply,
  EyeOff,
  Eye,
  Flag,
  Download,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  adminFetcher,
  formatCurrency,
  formatDate,
  verifyRestaurant,
  saveRestaurantDocument,
  reviewRestaurantDocument,
  saveRestaurantBankAccount,
  reviewRestaurantBankAccount,
  moderateRestaurantReview,
  updateRestaurantMenuItem,
  createRestaurantMenuItem,
  deleteRestaurantMenuItem,
  fetchRestaurantMenuCategories,
  createRestaurantMenuCategory,
  deleteRestaurantMenuCategory,
  fetchRestaurantRevenueTrend,
  fetchRestaurantAnalytics,
  fetchRestaurantReviews,
  fetchRestaurantSettlements,
  fetchRestaurantsExportBlob,
  downloadBlob,
  type AdminRestaurantDetail,
  type AdminRestaurantVerificationEvent,
  type AdminRestaurantReviewsResponse,
  type AdminRestaurantSettlementsResponse,
  type AdminRestaurantRevenuePoint,
  type AdminRestaurantAnalytics,
  type AdminMenuCategory,
} from "@/services/adminApi";
import { uploadMedia } from "@/services/mediaApi";
import { useAdminRestaurantDetail, useAdminOrders } from "@/hooks/useAdminData";
import { useToast } from "@/contexts/ToastContext";
import RestaurantVerificationTimeline from "./RestaurantVerificationTimeline";
import RestaurantAnalyticsCharts from "./RestaurantAnalyticsCharts";

type MenuItemRow = {
  id: string;
  name: string;
  category_name?: string;
  price: number;
  discount_price?: number;
  is_available?: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "verification", label: "Verification" },
  { key: "menu", label: "Menu" },
  { key: "orders", label: "Orders" },
  { key: "analytics", label: "Analytics" },
  { key: "reviews", label: "Reviews" },
  { key: "payments", label: "Payments" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function RestaurantDetailsDrawer({
  restaurantId,
  onClose,
  onChanged,
}: {
  restaurantId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const { data, isLoading, error, mutate } = useAdminRestaurantDetail(restaurantId);
  const { showToast } = useToast();

  const refresh = async () => {
    await mutate();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-3xl h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-black text-foreground">{data?.name || "Restaurant"}</h2>
            {data && (
              <p className="text-xs text-gray-text capitalize">
                {data.approval_status || "approved"} · {data.is_active === false ? "Suspended" : data.is_open === false ? "Temporarily closed" : "Active"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close restaurant details"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-section"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="sticky top-[65px] bg-white border-b border-border px-6 flex gap-1 overflow-x-auto z-10">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-text hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-section rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600 mb-3">Failed to load restaurant details.</p>
            <button type="button" onClick={() => mutate()} className="text-sm font-bold text-primary underline">
              Retry
            </button>
          </div>
        )}

        {data && !isLoading && (
          <div className="p-6">
            {tab === "overview" && <OverviewTab data={data} />}
            {tab === "verification" && (
              <VerificationTab data={data} restaurantId={restaurantId} onChanged={refresh} showToast={showToast} />
            )}
            {tab === "menu" && <MenuTab restaurantId={restaurantId} showToast={showToast} />}
            {tab === "orders" && <OrdersTab restaurantId={restaurantId} />}
            {tab === "analytics" && <AnalyticsTab restaurantId={restaurantId} />}
            {tab === "reviews" && <ReviewsTab restaurantId={restaurantId} showToast={showToast} />}
            {tab === "payments" && <PaymentsTab restaurantId={restaurantId} restaurantName={data.name} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="bg-section rounded-2xl p-4 mb-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#9CA3AF] mb-2">
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-text">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

function OverviewTab({ data }: { data: AdminRestaurantDetail }) {
  const hours = data.opening_hours && typeof data.opening_hours === "object" ? data.opening_hours : {};
  const cuisines = Array.isArray(data.cuisine_types) ? data.cuisine_types : [];
  const gallery = Array.isArray(data.gallery_urls) ? data.gallery_urls : [];
  const mapUrl =
    data.current_lat && data.current_lng
      ? `https://www.google.com/maps/search/?api=1&query=${data.current_lat},${data.current_lng}`
      : data.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
        : null;

  return (
    <div>
      <Section title="Restaurant Details" icon={ShoppingBag}>
        <Row label="Restaurant ID" value={<span className="font-mono text-xs">{data.id}</span>} />
        <Row label="Description" value={data.description || "—"} />
        <Row label="Rating" value={<span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {Number(data.rating || 0).toFixed(1)} ({data.review_count || 0} reviews)</span>} />
        <Row label="Menu Items" value={data.menu_count ?? 0} />
        <Row label="Min Order Amount" value={formatCurrency(data.min_order_amount || 0)} />
        <Row label="Delivery Radius" value={`${data.delivery_radius_km ?? "—"} km`} />
        <Row label="Created" value={formatDate(data.created_at)} />
      </Section>

      <Section title="Owner Details" icon={User}>
        <Row label="Name" value={data.owner_name || "—"} />
        <Row label="Email" value={data.owner_email || "—"} />
        <Row label="Phone" value={data.owner_phone || "—"} />
      </Section>

      <Section title="Address & Location" icon={MapPin}>
        <Row label="Address" value={data.address || "—"} />
        <Row label="City" value={data.city || "—"} />
        <Row label="Zone" value={data.zone || "—"} />
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-primary mt-2">
            View on Google Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </Section>

      <Section title="Business Hours" icon={Clock}>
        {Object.keys(hours).length ? (
          Object.entries(hours as Record<string, unknown>).map(([day, val]) => (
            <Row key={day} label={day} value={typeof val === "string" ? val : JSON.stringify(val)} />
          ))
        ) : (
          <p className="text-sm text-gray-text">Not set.</p>
        )}
      </Section>

      <Section title="Cuisine" icon={Utensils}>
        {cuisines.length ? (
          <div className="flex flex-wrap gap-1.5">
            {cuisines.map((c, i) => (
              <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-border">{c}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-text">{data.category_name || "Not set."}</p>
        )}
      </Section>

      <Section title="Images" icon={ImageIcon}>
        <div className="flex flex-wrap gap-2">
          {[data.logo_url, data.banner_url, ...gallery].filter(Boolean).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url as string} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
          ))}
          {![data.logo_url, data.banner_url, ...gallery].filter(Boolean).length && (
            <p className="text-sm text-gray-text">No images uploaded.</p>
          )}
        </div>
      </Section>
    </div>
  );
}

function VerificationTab({
  data,
  restaurantId,
  onChanged,
  showToast,
}: {
  data: AdminRestaurantDetail;
  restaurantId: string;
  onChanged: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const { data: timeline } = useSWR<AdminRestaurantVerificationEvent[]>(
    `/api/admin/restaurants/${restaurantId}/verification-timeline`,
    adminFetcher
  );
  const [busy, setBusy] = useState<string | null>(null);
  const docNumberFor = (type: string) => data.documents.find((d) => d.document_type === type)?.document_number || "";
  const [gst, setGst] = useState(docNumberFor("gst"));
  const [fssai, setFssai] = useState(docNumberFor("fssai"));
  const [pan, setPan] = useState(docNumberFor("pan"));
  const [bank, setBank] = useState({
    account_holder_name: data.bank_account?.account_holder_name || "",
    account_number: "",
    bank_name: data.bank_account?.bank_name || "",
    ifsc_code: data.bank_account?.ifsc_code || "",
  });

  const act = async (action: "approve" | "reject" | "suspend" | "activate") => {
    let reason: string | undefined;
    if (action === "reject" || action === "suspend") {
      reason = prompt(`Reason for ${action === "reject" ? "rejecting" : "suspending"} this restaurant:`) || undefined;
      if (action === "reject" && !reason) {
        showToast("A reason is required to reject", "error");
        return;
      }
    }
    setBusy(action);
    try {
      await verifyRestaurant(restaurantId, action, reason);
      await onChanged();
      showToast(`Restaurant ${action}d`, "success");
    } catch {
      showToast(`Failed to ${action} restaurant`, "error");
    } finally {
      setBusy(null);
    }
  };

  const saveDoc = async (type: "gst" | "fssai" | "pan", number: string) => {
    if (!number) return;
    setBusy(`doc-${type}`);
    try {
      await saveRestaurantDocument(restaurantId, { document_type: type, document_number: number });
      await onChanged();
      showToast(`${type.toUpperCase()} saved`, "success");
    } catch {
      showToast(`Failed to save ${type.toUpperCase()}`, "error");
    } finally {
      setBusy(null);
    }
  };

  const reviewDoc = async (docId: string, status: "approved" | "rejected") => {
    let reason: string | undefined;
    if (status === "rejected") {
      reason = prompt("Reason for rejecting this document:") || undefined;
      if (!reason) return;
    }
    setBusy(`review-${docId}`);
    try {
      await reviewRestaurantDocument(restaurantId, docId, { status, reason });
      await onChanged();
      showToast(`Document ${status}`, "success");
    } catch {
      showToast("Failed to review document", "error");
    } finally {
      setBusy(null);
    }
  };

  const saveBank = async () => {
    if (!bank.account_holder_name || !bank.account_number || !bank.bank_name || !bank.ifsc_code) {
      showToast("All bank fields except UPI are required", "error");
      return;
    }
    setBusy("bank");
    try {
      await saveRestaurantBankAccount(restaurantId, bank);
      await onChanged();
      showToast("Bank details saved", "success");
    } catch {
      showToast("Failed to save bank details", "error");
    } finally {
      setBusy(null);
    }
  };

  const reviewBank = async (status: "approved" | "rejected") => {
    let reason: string | undefined;
    if (status === "rejected") {
      reason = prompt("Reason for rejecting the bank account:") || undefined;
      if (!reason) return;
    }
    setBusy("bank-review");
    try {
      await reviewRestaurantBankAccount(restaurantId, { status, reason });
      await onChanged();
      showToast(`Bank account ${status}`, "success");
    } catch {
      showToast("Failed to review bank account", "error");
    } finally {
      setBusy(null);
    }
  };

  const docFor = (type: string) => data.documents.find((d) => d.document_type === type);

  return (
    <div>
      <Section title="Verification Actions" icon={CheckCircle2}>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => act("approve")} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-white px-3 py-2 rounded-lg disabled:opacity-50">
            {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
          </button>
          <button type="button" onClick={() => act("reject")} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-red-500 text-white px-3 py-2 rounded-lg disabled:opacity-50">
            {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
          </button>
          <button type="button" onClick={() => act("suspend")} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-white px-3 py-2 rounded-lg disabled:opacity-50">
            {busy === "suspend" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Suspend
          </button>
          <button type="button" onClick={() => act("activate")} disabled={!!busy} className="flex items-center gap-1.5 text-xs font-bold bg-blue-500 text-white px-3 py-2 rounded-lg disabled:opacity-50">
            {busy === "activate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />} Activate
          </button>
        </div>
      </Section>

      <Section title="GST / FSSAI / PAN" icon={FileText}>
        {([
          { key: "gst" as const, label: "GST Number", value: gst, setValue: setGst },
          { key: "fssai" as const, label: "FSSAI Number", value: fssai, setValue: setFssai },
          { key: "pan" as const, label: "PAN Number", value: pan, setValue: setPan },
        ]).map((doc) => {
          const existing = docFor(doc.key);
          return (
            <div key={doc.key} className="mb-3 last:mb-0">
              <p className="text-xs font-bold text-foreground mb-1">{doc.label}</p>
              <div className="flex gap-2">
                <input
                  value={doc.value}
                  onChange={(e) => doc.setValue(e.target.value)}
                  className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-white"
                  placeholder={`Enter ${doc.label}`}
                />
                <button
                  type="button"
                  onClick={() => saveDoc(doc.key, doc.value)}
                  disabled={busy === `doc-${doc.key}`}
                  className="border border-border font-bold px-3 rounded-xl text-xs hover:bg-white disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              {existing && (
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    existing.verification_status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    existing.verification_status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {existing.verification_status}
                  </span>
                  {existing.verification_status !== "approved" && (
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => reviewDoc(existing.id, "approved")} disabled={!!busy} className="text-[11px] font-bold text-emerald-600">Approve</button>
                      <button type="button" onClick={() => reviewDoc(existing.id, "rejected")} disabled={!!busy} className="text-[11px] font-bold text-red-600">Reject</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Section>

      <Section title="Bank Details" icon={Landmark}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={bank.account_holder_name} onChange={(e) => setBank((b) => ({ ...b, account_holder_name: e.target.value }))} placeholder="Account holder name" className="border border-border rounded-xl px-3 py-2 text-sm bg-white col-span-2" />
          <input value={bank.account_number} onChange={(e) => setBank((b) => ({ ...b, account_number: e.target.value }))} placeholder={data.bank_account ? `Account number (current: ${data.bank_account.account_number_masked})` : "Account number"} className="border border-border rounded-xl px-3 py-2 text-sm bg-white col-span-2" />
          <input value={bank.bank_name} onChange={(e) => setBank((b) => ({ ...b, bank_name: e.target.value }))} placeholder="Bank name" className="border border-border rounded-xl px-3 py-2 text-sm bg-white" />
          <input value={bank.ifsc_code} onChange={(e) => setBank((b) => ({ ...b, ifsc_code: e.target.value }))} placeholder="IFSC code" className="border border-border rounded-xl px-3 py-2 text-sm bg-white" />
        </div>
        <button type="button" onClick={saveBank} disabled={busy === "bank"} className="w-full border border-border font-bold py-2 rounded-xl text-sm hover:bg-white disabled:opacity-50 mb-2">
          {busy === "bank" ? "Saving…" : "Save Bank Details"}
        </button>
        {data.bank_account && (
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
              data.bank_account.verification_status === "approved" ? "bg-emerald-50 text-emerald-700" :
              data.bank_account.verification_status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            }`}>
              {data.bank_account.verification_status}
            </span>
            {data.bank_account.verification_status !== "approved" && (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => reviewBank("approved")} disabled={!!busy} className="text-[11px] font-bold text-emerald-600">Approve</button>
                <button type="button" onClick={() => reviewBank("rejected")} disabled={!!busy} className="text-[11px] font-bold text-red-600">Reject</button>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="Verification Timeline & Reason History" icon={Clock}>
        <RestaurantVerificationTimeline events={timeline || []} />
      </Section>
    </div>
  );
}

const EMPTY_ITEM_FORM = {
  name: "",
  price: "",
  discount_price: "",
  category_id: "",
  description: "",
  preparation_time: "",
  is_vegetarian: true,
};

function MenuTab({ restaurantId, showToast }: { restaurantId: string; showToast: (msg: string, type: "success" | "error") => void }) {
  const { data, mutate, isLoading } = useSWR<MenuItemRow[]>(`/api/admin/menu?restaurant_id=${restaurantId}`, adminFetcher);
  const { data: categories, mutate: mutateCategories } = useSWR<AdminMenuCategory[]>(
    `menu-categories-${restaurantId}`,
    () => fetchRestaurantMenuCategories(restaurantId)
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const toggle = async (item: MenuItemRow, field: "is_available" | "is_featured") => {
    setBusyId(item.id);
    try {
      await updateRestaurantMenuItem(item.id, { [field]: !item[field] });
      await mutate();
      showToast("Menu item updated", "success");
    } catch {
      showToast("Failed to update menu item", "error");
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (item: MenuItemRow) => {
    if (!confirm(`Remove "${item.name}" from the menu? This cannot be undone.`)) return;
    setBusyId(item.id);
    try {
      await deleteRestaurantMenuItem(item.id);
      await mutate();
      showToast("Menu item removed", "success");
    } catch {
      showToast("Failed to remove menu item", "error");
    } finally {
      setBusyId(null);
    }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setSavingCategory(true);
    try {
      await createRestaurantMenuCategory({ restaurant_id: restaurantId, name });
      await mutateCategories();
      setNewCategory("");
      showToast("Category added", "success");
    } catch {
      showToast("Failed to add category", "error");
    } finally {
      setSavingCategory(false);
    }
  };

  const removeCategory = async (category: AdminMenuCategory) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await deleteRestaurantMenuCategory(category.id);
      await mutateCategories();
      showToast("Category deleted", "success");
    } catch {
      showToast("Failed to delete category", "error");
    }
  };

  const addItem = async () => {
    const name = itemForm.name.trim();
    const price = Number(itemForm.price);
    if (!name || !price || price <= 0) {
      showToast("Item name and a valid price are required", "error");
      return;
    }
    setSavingItem(true);
    try {
      let image_url: string | undefined;
      if (itemImage) {
        const asset = await uploadMedia(itemImage, { purpose: "food", entity_type: "restaurant", entity_id: restaurantId });
        image_url = asset.url;
      }
      await createRestaurantMenuItem({
        restaurant_id: restaurantId,
        name,
        price,
        discount_price: itemForm.discount_price ? Number(itemForm.discount_price) : undefined,
        category_id: itemForm.category_id || undefined,
        description: itemForm.description || undefined,
        preparation_time: itemForm.preparation_time ? Number(itemForm.preparation_time) : undefined,
        is_vegetarian: itemForm.is_vegetarian,
        image_url,
      });
      await mutate();
      setItemForm(EMPTY_ITEM_FORM);
      setItemImage(null);
      setShowAddItem(false);
      showToast("Menu item added", "success");
    } catch {
      showToast("Failed to add menu item", "error");
    } finally {
      setSavingItem(false);
    }
  };

  if (isLoading) return <div className="h-40 bg-section rounded-xl animate-pulse" />;

  const items = data || [];
  const outOfStock = items.filter((i) => i.is_available === false).length;
  const featured = items.filter((i) => i.is_featured).length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-section rounded-xl p-3 text-center">
          <p className="text-lg font-black">{items.length}</p>
          <p className="text-[10px] text-gray-text uppercase font-bold">Products</p>
        </div>
        <div className="bg-section rounded-xl p-3 text-center">
          <p className="text-lg font-black">{categories?.length ?? 0}</p>
          <p className="text-[10px] text-gray-text uppercase font-bold">Categories</p>
        </div>
        <div className="bg-section rounded-xl p-3 text-center">
          <p className="text-lg font-black">{outOfStock}</p>
          <p className="text-[10px] text-gray-text uppercase font-bold">Out of Stock</p>
        </div>
      </div>
      <p className="text-xs text-gray-text mb-3">{featured} featured item(s)</p>

      <div className="mb-4">
        <p className="text-xs font-bold text-foreground mb-1.5">Categories</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(categories || []).map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-section border border-border">
              {c.name}
              <button type="button" onClick={() => removeCategory(c)} aria-label={`Delete ${c.name}`} className="text-gray-text hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {!categories?.length && <span className="text-xs text-gray-text">No categories yet.</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 border border-border rounded-xl px-3 py-1.5 text-sm bg-white"
          />
          <button
            type="button"
            onClick={addCategory}
            disabled={savingCategory || !newCategory.trim()}
            className="border border-border font-bold px-3 rounded-xl text-xs hover:bg-section disabled:opacity-50"
          >
            {savingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-foreground">Items</p>
        <button
          type="button"
          onClick={() => setShowAddItem((v) => !v)}
          className="flex items-center gap-1 text-xs font-bold text-primary"
        >
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      {showAddItem && (
        <div className="border border-border rounded-xl p-3.5 mb-3 space-y-2">
          <input
            value={itemForm.name}
            onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Item name"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={itemForm.price}
              onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Price"
              type="number"
              min="0"
              step="0.01"
              className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
            />
            <input
              value={itemForm.discount_price}
              onChange={(e) => setItemForm((f) => ({ ...f, discount_price: e.target.value }))}
              placeholder="Discount price (optional)"
              type="number"
              min="0"
              step="0.01"
              className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
            />
          </div>
          <select
            value={itemForm.category_id}
            onChange={(e) => setItemForm((f) => ({ ...f, category_id: e.target.value }))}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">Uncategorized</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <textarea
            value={itemForm.description}
            onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white"
          />
          <div className="grid grid-cols-2 gap-2 items-center">
            <input
              value={itemForm.preparation_time}
              onChange={(e) => setItemForm((f) => ({ ...f, preparation_time: e.target.value }))}
              placeholder="Prep time (mins)"
              type="number"
              min="0"
              className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
            />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={itemForm.is_vegetarian}
                onChange={(e) => setItemForm((f) => ({ ...f, is_vegetarian: e.target.checked }))}
              />
              Vegetarian
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-text border border-dashed border-border rounded-xl px-3 py-2 cursor-pointer hover:bg-section">
            <Upload className="w-3.5 h-3.5" />
            {itemImage ? itemImage.name : "Upload image (optional)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setItemImage(e.target.files?.[0] || null)}
            />
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={addItem}
              disabled={savingItem}
              className="flex-1 bg-primary text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {savingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Item
            </button>
            <button
              type="button"
              onClick={() => { setShowAddItem(false); setItemForm(EMPTY_ITEM_FORM); setItemImage(null); }}
              className="border border-border font-bold px-4 rounded-xl text-sm hover:bg-section"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border border-border rounded-xl px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
              <p className="text-xs text-gray-text">{item.category_name || "Uncategorized"} · {formatCurrency(item.discount_price || item.price)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggle(item, "is_featured")}
                disabled={busyId === item.id}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.is_featured ? "bg-primary/10 text-primary border-primary/30" : "border-border text-gray-text"}`}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => toggle(item, "is_available")}
                disabled={busyId === item.id}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.is_available === false ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
              >
                {item.is_available === false ? "Out of Stock" : "Available"}
              </button>
              <button
                type="button"
                onClick={() => removeItem(item)}
                disabled={busyId === item.id}
                aria-label={`Remove ${item.name}`}
                className="w-7 h-7 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-sm text-gray-text text-center py-8">No menu items yet.</p>}
      </div>
    </div>
  );
}

const ORDER_STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready for Pickup", value: "ready for pickup" },
  { label: "On the Way", value: "on the way" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function OrdersTab({ restaurantId }: { restaurantId: string }) {
  const [status, setStatus] = useState("");
  const { data, isLoading } = useAdminOrders({ restaurant_id: restaurantId, status: status || undefined, sort: "latest", page: 1, limit: 20 });
  const rows = data?.rows || [];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {ORDER_STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${status === f.value ? "bg-primary text-white border-primary" : "border-border text-gray-text hover:bg-section"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="h-40 bg-section rounded-xl animate-pulse" />
      ) : (
        <>
          <p className="text-xs text-gray-text mb-1">{data?.pagination?.total ?? 0} order(s){status ? ` · ${status}` : ""}</p>
          {rows.map((o) => (
            <div key={o.id} className="flex items-center justify-between border border-border rounded-xl px-3.5 py-2.5">
              <div>
                <p className="font-mono text-xs font-bold text-primary">#{o.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-text">{o.customer_name} · {formatDate(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{formatCurrency(o.total_amount)}</p>
                <p className="text-xs text-gray-text capitalize">{o.status}</p>
              </div>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-gray-text text-center py-8">No orders yet.</p>}
        </>
      )}
    </div>
  );
}

function AnalyticsTab({ restaurantId }: { restaurantId: string }) {
  const { data: revenueTrend } = useSWR<AdminRestaurantRevenuePoint[]>(
    `revenue-trend-${restaurantId}`,
    () => fetchRestaurantRevenueTrend(restaurantId)
  );
  const { data: analytics } = useSWR<AdminRestaurantAnalytics>(
    `analytics-${restaurantId}`,
    () => fetchRestaurantAnalytics(restaurantId)
  );

  return <RestaurantAnalyticsCharts revenueTrend={revenueTrend} analytics={analytics} />;
}

function ReviewsTab({ restaurantId, showToast }: { restaurantId: string; showToast: (msg: string, type: "success" | "error") => void }) {
  const { data, mutate, isLoading } = useSWR<AdminRestaurantReviewsResponse>(
    `reviews-${restaurantId}`,
    () => fetchRestaurantReviews(restaurantId)
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const act = async (reviewId: string, body: Parameters<typeof moderateRestaurantReview>[1]) => {
    setBusyId(reviewId);
    try {
      await moderateRestaurantReview(reviewId, body);
      await mutate();
      showToast("Review updated", "success");
    } catch {
      showToast("Failed to update review", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <div className="h-40 bg-section rounded-xl animate-pulse" />;

  const reviews = data?.rows || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <p className="text-sm font-bold">{(data?.avg_rating || 0).toFixed(1)} average · {data?.review_count ?? 0} reviews</p>
      </div>
      <div className="space-y-3">
        {reviews.map((rv) => (
          <div key={rv.id} className="border border-border rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold">{rv.customer_name || "Customer"}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {rv.rating}
              </span>
            </div>
            <p className="text-sm text-gray-text mb-2">{rv.comment || "—"}</p>
            {rv.admin_reply && (
              <div className="bg-section rounded-lg p-2 text-xs mb-2">
                <span className="font-bold">Admin reply: </span>{rv.admin_reply}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={replyDrafts[rv.id] ?? ""}
                onChange={(e) => setReplyDrafts((d) => ({ ...d, [rv.id]: e.target.value }))}
                placeholder="Write a reply…"
                className="flex-1 min-w-[140px] border border-border rounded-lg px-2.5 py-1.5 text-xs"
              />
              <button
                type="button"
                disabled={busyId === rv.id || !replyDrafts[rv.id]}
                onClick={() => act(rv.id, { reply: replyDrafts[rv.id] })}
                className="flex items-center gap-1 text-[11px] font-bold text-primary disabled:opacity-40"
              >
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
              <button
                type="button"
                disabled={busyId === rv.id}
                onClick={() => act(rv.id, { status: rv.status === "hidden" ? "visible" : "hidden" })}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 disabled:opacity-40"
              >
                {rv.status === "hidden" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {rv.status === "hidden" ? "Unhide" : "Hide"}
              </button>
              <button
                type="button"
                disabled={busyId === rv.id}
                onClick={() => act(rv.id, { reported: !rv.is_reported })}
                className={`flex items-center gap-1 text-[11px] font-bold disabled:opacity-40 ${rv.is_reported ? "text-red-600" : "text-gray-text"}`}
              >
                <Flag className="w-3.5 h-3.5" /> {rv.is_reported ? "Reported" : "Report Abuse"}
              </button>
            </div>
          </div>
        ))}
        {!reviews.length && <p className="text-sm text-gray-text text-center py-8">No reviews yet.</p>}
      </div>
    </div>
  );
}

function PaymentsTab({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
  const { data, isLoading } = useSWR<AdminRestaurantSettlementsResponse>(
    `settlements-${restaurantId}`,
    () => fetchRestaurantSettlements(restaurantId)
  );
  const [downloading, setDownloading] = useState(false);

  const downloadStatement = async () => {
    setDownloading(true);
    try {
      const blob = await fetchRestaurantsExportBlob({ search: restaurantId }, "pdf");
      downloadBlob(blob, `${restaurantName.replace(/\s+/g, "-").toLowerCase()}-statement.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) return <div className="h-40 bg-section rounded-xl animate-pulse" />;

  const settlement = data?.settlements?.[0];

  return (
    <div>
      <Section title="Settlement Summary" icon={Landmark}>
        <Row label="Commission Rate" value={`${(data?.commission_rate ?? 0).toFixed(1)}%`} />
        <Row label="Gross Revenue" value={formatCurrency(settlement?.gross_revenue || 0)} />
        <Row label="Commission" value={formatCurrency(settlement?.commission || 0)} />
        <Row label="Delivered Orders" value={settlement?.delivered_orders ?? 0} />
        <div className="border-t border-border mt-2 pt-2">
          <Row label="Net Settlement" value={<span className="font-black">{formatCurrency(settlement?.settlement || 0)}</span>} />
        </div>
      </Section>

      <button
        type="button"
        onClick={downloadStatement}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-section disabled:opacity-50"
      >
        <Download className="w-4 h-4" /> {downloading ? "Preparing…" : "Download Statement (PDF)"}
      </button>
      <p className="text-xs text-gray-text mt-2">
        {settlement ? "Settlement reflects all delivered orders to date." : "No settlement activity yet — this restaurant has no delivered orders."}
      </p>
    </div>
  );
}
