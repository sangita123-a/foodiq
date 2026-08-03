"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  MapPin,
  Plus,
  Search,
  Trash2,
  Edit3,
  UserPlus,
  UserMinus,
  Users,
  Layers,
  Circle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
  X,
  AlertTriangle,
  BarChart3,
  Flame,
  Radio,
  ShieldAlert,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import ZoneDrawMap from "@/components/admin/ZoneDrawMap";
import ZoneHeatmapMap from "@/components/admin/ZoneHeatmapMap";
import { isClientAuthenticated } from "@/lib/authSession";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { fetcher } from "@/services/api";
import type { DeliveryZone } from "@/services/zonesApi";
import {
  fetchAdminZones,
  createZone,
  updateZone,
  deleteZone,
  assignPartnerToZone,
  removePartnerFromZone,
  fetchZonePartners,
  fetchZoneViolations,
  resolveZoneViolation,
  fetchLiveRiders,
  fetchZoneHeatmap,
  fetchZoneAnalytics,
  type ZoneInput,
} from "@/services/adminZonesApi";

type TabKey = "zones" | "violations" | "live-riders" | "heatmap";

const TABS: Array<{ key: TabKey; label: string; icon: typeof MapIcon }> = [
  { key: "zones", label: "Zones", icon: MapIcon },
  { key: "violations", label: "Violations", icon: ShieldAlert },
  { key: "live-riders", label: "Live Riders", icon: Radio },
  { key: "heatmap", label: "Heatmap", icon: Flame },
];

export default function AdminDeliveryZonesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("zones");

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [manageRidersZone, setManageRidersZone] = useState<DeliveryZone | null>(null);
  const [analyticsZone, setAnalyticsZone] = useState<DeliveryZone | null>(null);

  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formZoneType, setFormZoneType] = useState<"polygon" | "circle">("polygon");
  const [formRadiusKm, setFormRadiusKm] = useState("2");
  const [formCenter, setFormCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [formPolygonPoints, setFormPolygonPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formPriority, setFormPriority] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/admin/login");
    }
  }, [router]);

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const { data, pagination } = await fetchAdminZones({ page, limit, search: search || undefined });
      setZones(data);
      setTotal(pagination.total);
    } catch (err) {
      console.error("Failed to fetch delivery zones", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onChanged = () => fetchZones();
    socket.on(SOCKET_EVENTS.DELIVERY_ZONE_CHANGED, onChanged);
    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_ZONE_CHANGED, onChanged);
    };
  }, [fetchZones]);

  const { data: partnersData } = useSWR("/api/admin/delivery-partners", fetcher);
  const partnersList = (partnersData?.data?.partners || partnersData?.partners || []) as Array<{
    id: string;
    full_name?: string;
    email?: string;
  }>;

  const resetForm = () => {
    setFormName("");
    setFormCity("");
    setFormState("");
    setFormZoneType("polygon");
    setFormRadiusKm("2");
    setFormCenter(null);
    setFormPolygonPoints([]);
    setFormIsActive(true);
    setFormPriority("0");
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormName(zone.name);
    setFormCity(zone.city);
    setFormState(zone.state || "");
    setFormZoneType(zone.zone_type);
    setFormRadiusKm(zone.radius_km ? String(zone.radius_km) : "2");
    setFormCenter(
      zone.center_latitude != null && zone.center_longitude != null
        ? { lat: zone.center_latitude, lng: zone.center_longitude }
        : null
    );
    const points = Array.isArray(zone.polygon)
      ? (zone.polygon as Array<[number, number]>)
          .map(([lng, lat]) => ({ lat, lng }))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      : [];
    setFormPolygonPoints(points);
    setFormIsActive(zone.is_active);
    setFormPriority(String(zone.priority ?? 0));
    setShowCreateModal(true);
  };

  const handleSubmitZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const body: ZoneInput = {
        name: formName,
        city: formCity,
        state: formState || undefined,
        country: "India",
        zone_type: formZoneType,
        polygon:
          formZoneType === "polygon" ? formPolygonPoints.map((p) => [p.lng, p.lat] as [number, number]) : null,
        center_latitude: formZoneType === "circle" ? formCenter?.lat ?? null : null,
        center_longitude: formZoneType === "circle" ? formCenter?.lng ?? null : null,
        radius_km: formZoneType === "circle" ? parseFloat(formRadiusKm) : null,
        is_active: formIsActive,
        priority: parseInt(formPriority, 10) || 0,
      };

      if (formZoneType === "polygon" && formPolygonPoints.length < 3) {
        alert("A polygon zone needs at least 3 points — click the map to add them.");
        setSubmitting(false);
        return;
      }
      if (formZoneType === "circle" && !formCenter) {
        alert("Click the map to set the circle's center.");
        setSubmitting(false);
        return;
      }

      if (editingZone) {
        await updateZone(editingZone.id, body);
      } else {
        await createZone(body);
      }

      setShowCreateModal(false);
      setEditingZone(null);
      resetForm();
      fetchZones();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || "Failed to save delivery zone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return;
    try {
      await deleteZone(id);
      fetchZones();
    } catch (err) {
      console.error("Failed to delete zone", err);
      alert("Failed to delete delivery zone");
    }
  };

  const { data: zonePartners, mutate: mutateZonePartners, isLoading: loadingZonePartners } = useSWR(
    manageRidersZone ? `/api/admin/delivery-zones/${manageRidersZone.id}/partners` : null,
    () => fetchZonePartners(manageRidersZone!.id)
  );

  const handleAssignPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageRidersZone || !partnerIdInput) return;
    try {
      setAssigning(true);
      await assignPartnerToZone(manageRidersZone.id, partnerIdInput);
      setPartnerIdInput("");
      mutateZonePartners();
      fetchZones();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || "Failed to assign partner");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    if (!manageRidersZone) return;
    if (!confirm("Remove this rider from the zone?")) return;
    try {
      await removePartnerFromZone(manageRidersZone.id, partnerId);
      mutateZonePartners();
      fetchZones();
    } catch (err) {
      console.error("Failed to remove partner", err);
      alert("Failed to remove partner");
    }
  };

  const { data: zoneAnalytics, isLoading: loadingAnalytics } = useSWR(
    analyticsZone ? `/api/admin/delivery-zones/${analyticsZone.id}/analytics` : null,
    () => fetchZoneAnalytics(analyticsZone!.id)
  );

  return (
    <AdminShell title="Geo-fencing & Delivery Zones">
      <div className="space-y-6">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-2xl p-1.5 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                tab === key ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "zones" && (
          <ZonesTab
            zones={zones}
            total={total}
            page={page}
            limit={limit}
            search={search}
            loading={loading}
            loadError={loadError}
            onSearchChange={setSearch}
            onPageChange={setPage}
            onRefresh={fetchZones}
            onCreate={() => {
              setEditingZone(null);
              resetForm();
              setShowCreateModal(true);
            }}
            onEdit={openEdit}
            onDelete={handleDeleteZone}
            onManageRiders={setManageRidersZone}
            onViewAnalytics={setAnalyticsZone}
          />
        )}

        {tab === "violations" && <ViolationsTab />}

        {tab === "live-riders" && <LiveRidersTab />}

        {tab === "heatmap" && <HeatmapTab />}
      </div>

      {/* Create / Edit Zone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl relative my-8">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-4">
              {editingZone ? "Edit Delivery Zone" : "Define New Delivery Zone"}
            </h3>

            <form onSubmit={handleSubmitZone} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Zone Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Indiranagar & Koramangala Zone"
                    className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Priority</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Zone Geometry Type</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="zone_type"
                      value="polygon"
                      checked={formZoneType === "polygon"}
                      onChange={() => setFormZoneType("polygon")}
                    />
                    Polygon Boundary
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="zone_type"
                      value="circle"
                      checked={formZoneType === "circle"}
                      onChange={() => setFormZoneType("circle")}
                    />
                    Circle Radius
                  </label>
                </div>
              </div>

              <ZoneDrawMap
                zoneType={formZoneType}
                polygonPoints={formPolygonPoints}
                onPolygonPointsChange={setFormPolygonPoints}
                center={formCenter}
                onCenterChange={setFormCenter}
                radiusKm={parseFloat(formRadiusKm) || 0.1}
              />

              {formZoneType === "polygon" ? (
                <button
                  type="button"
                  onClick={() => setFormPolygonPoints((prev) => prev.slice(0, -1))}
                  disabled={formPolygonPoints.length === 0}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Undo last point
                </button>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Radius (km)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={formRadiusKm}
                    onChange={(e) => setFormRadiusKm(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none text-foreground"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-foreground">
                  Zone is active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Delivery Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Riders Modal (assign + remove) */}
      {manageRidersZone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setManageRidersZone(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-1">Riders — {manageRidersZone.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Assign or remove delivery partners for this zone.</p>

            {loadingZonePartners ? (
              <div className="space-y-2 mb-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-section animate-pulse" />
                ))}
              </div>
            ) : zonePartners && zonePartners.length > 0 ? (
              <div className="space-y-2 mb-4">
                {zonePartners.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.full_name || "Delivery Partner"}</p>
                      <p className="text-[11px] text-muted-foreground">{p.email || p.phone_number || ""}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePartner(p.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-muted-foreground hover:text-red-600"
                      title="Remove Rider"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-border rounded-xl mb-4">
                No riders assigned to this zone yet.
              </p>
            )}

            <form onSubmit={handleAssignPartner} className="space-y-3 pt-3 border-t border-border">
              <label className="block text-xs font-bold text-muted-foreground">Assign a Rider</label>
              <select
                value={partnerIdInput}
                onChange={(e) => setPartnerIdInput(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none text-foreground"
              >
                <option value="">-- Select Partner --</option>
                {partnersList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || "Partner"} ({p.email || p.id.slice(0, 8)})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={assigning || !partnerIdInput}
                className="w-full px-5 py-2 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> {assigning ? "Assigning..." : "Assign Rider"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Zone Analytics Modal */}
      {analyticsZone && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setAnalyticsZone(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-foreground mb-4">Analytics — {analyticsZone.name}</h3>

            {loadingAnalytics ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-section animate-pulse" />
                ))}
              </div>
            ) : zoneAnalytics ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-section rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Riders</p>
                  <p className="text-xl font-black text-foreground">{zoneAnalytics.assigned_riders_count}</p>
                </div>
                <div className="bg-section rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Active Now</p>
                  <p className="text-xl font-black text-emerald-600">{zoneAnalytics.active_riders_now}</p>
                </div>
                <div className="bg-section rounded-xl p-3 col-span-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
                    Violations (30 days)
                  </p>
                  {zoneAnalytics.violations_last_30_days.length > 0 ? (
                    <div className="flex gap-3">
                      {zoneAnalytics.violations_last_30_days.map((v) => (
                        <span key={v.violation_type} className="text-xs font-bold text-red-600">
                          {v.violation_type}: {v.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No violations recorded.</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Failed to load analytics.</p>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function ZonesTab({
  zones,
  total,
  page,
  limit,
  search,
  loading,
  loadError,
  onSearchChange,
  onPageChange,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
  onManageRiders,
  onViewAnalytics,
}: {
  zones: DeliveryZone[];
  total: number;
  page: number;
  limit: number;
  search: string;
  loading: boolean;
  loadError: boolean;
  onSearchChange: (v: string) => void;
  onPageChange: (fn: (p: number) => number) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (zone: DeliveryZone) => void;
  onDelete: (id: string) => void;
  onManageRiders: (zone: DeliveryZone) => void;
  onViewAnalytics: (zone: DeliveryZone) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search delivery zones..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-section rounded-xl border border-border transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Draw / Add Zone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Zones</span>
          <h3 className="text-2xl font-bold text-foreground mt-1">{total}</h3>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Polygons</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {zones.filter((z) => z.zone_type === "polygon" && z.is_active).length}
          </h3>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Circles</span>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">
            {zones.filter((z) => z.zone_type === "circle" && z.is_active).length}
          </h3>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Riders</span>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {zones.reduce((acc, z) => acc + (z.assigned_partners_count || 0), 0)}
          </h3>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-section animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Failed to load delivery zones</p>
            <button
              onClick={onRefresh}
              className="mt-3 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : zones.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No delivery zones found. Click &quot;Draw / Add Zone&quot; to define a polygon or circle region.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-section border-b border-border text-xs uppercase text-muted-foreground font-bold">
                <tr>
                  <th className="px-6 py-3.5">Zone Name</th>
                  <th className="px-6 py-3.5">City / Region</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Riders</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-section/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span>{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {zone.city}
                      {zone.state ? `, ${zone.state}` : ""}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-muted-foreground uppercase">
                        {zone.zone_type === "polygon" ? (
                          <Layers className="w-3 h-3 text-primary" />
                        ) : (
                          <Circle className="w-3 h-3 text-blue-500" />
                        )}
                        {zone.zone_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-semibold">{zone.priority}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600">
                        <Users className="w-3 h-3" />
                        {zone.assigned_partners_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {zone.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewAnalytics(zone)}
                          className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-blue-600"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onManageRiders(zone)}
                          className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-purple-600"
                          title="Manage Riders"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(zone)}
                          className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-primary"
                          title="Edit Zone"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(zone.id)}
                          className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-red-600"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} zones
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => onPageChange((p) => p - 1)}
                className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-3 py-1 bg-section rounded-lg text-foreground">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                disabled={page * limit >= total}
                onClick={() => onPageChange((p) => p + 1)}
                className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViolationsTab() {
  const [resolvedFilter, setResolvedFilter] = useState("");
  const key = `/api/admin/delivery-zones/violations?resolved=${resolvedFilter}`;
  const { data, error, isLoading, mutate: mutateViolations } = useSWR(key, () =>
    fetchZoneViolations({ resolved: resolvedFilter || undefined, limit: 50 })
  );

  const handleResolve = async (id: string) => {
    try {
      await resolveZoneViolation(id);
      mutateViolations();
    } catch {
      alert("Failed to resolve violation");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" /> Zone Violations
        </h2>
        <select
          value={resolvedFilter}
          onChange={(e) => setResolvedFilter(e.target.value)}
          className="bg-section border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground"
        >
          <option value="">All</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-section animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <AlertTriangle className="w-7 h-7 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Failed to load violations</p>
          <button
            onClick={() => mutateViolations()}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : !data || data.violations.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No zone violations recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-section border-b border-border text-xs uppercase text-muted-foreground font-bold">
              <tr>
                <th className="px-6 py-3">Rider</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Distance</th>
                <th className="px-6 py-3">When</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.violations.map((v) => (
                <tr key={v.id} className="hover:bg-section/50">
                  <td className="px-6 py-3 font-semibold text-foreground">{v.partner_name || v.partner_id.slice(0, 8)}</td>
                  <td className="px-6 py-3 text-muted-foreground">{v.zone_name || "—"}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-600">
                      {v.violation_type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {v.distance_meters != null ? `${v.distance_meters}m` : "—"}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{new Date(v.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    {v.resolved ? (
                      <span className="text-xs font-bold text-emerald-600">Resolved</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">Open</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!v.resolved && (
                      <button
                        onClick={() => handleResolve(v.id)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LiveRidersTab() {
  const { data, error, isLoading, mutate: mutateRiders } = useSWR(
    "/api/admin/delivery-zones/live-riders",
    fetchLiveRiders,
    { refreshInterval: 15000 }
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600" /> Live Riders
        </h2>
        <button
          onClick={() => mutateRiders()}
          className="p-1.5 hover:bg-section rounded-lg text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-section animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <AlertTriangle className="w-7 h-7 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Failed to load live riders</p>
          <button
            onClick={() => mutateRiders()}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : !data || data.riders.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No riders are currently online.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-section border-b border-border text-xs uppercase text-muted-foreground font-bold">
              <tr>
                <th className="px-6 py-3">Rider</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Zone Status</th>
                <th className="px-6 py-3">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.riders.map((r) => (
                <tr key={r.partner_id} className="hover:bg-section/50">
                  <td className="px-6 py-3 font-semibold text-foreground">{r.full_name}</td>
                  <td className="px-6 py-3 text-muted-foreground font-mono text-xs">
                    {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                  </td>
                  <td className="px-6 py-3">
                    {r.in_zone === null ? (
                      <span className="text-xs font-bold text-muted-foreground">Unassigned</span>
                    ) : r.in_zone ? (
                      <span className="text-xs font-bold text-emerald-600">
                        Inside &mdash; {r.current_zone?.name}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600">Outside Zone</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">
                    {new Date(r.last_updated).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HeatmapTab() {
  const [hours, setHours] = useState(24);
  const { data, error, isLoading, mutate: mutateHeatmap } = useSWR(
    `/api/admin/delivery-zones/heatmap?hours=${hours}`,
    () => fetchZoneHeatmap(hours)
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-600" /> Activity &amp; Violation Heatmap
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="bg-section border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground"
          >
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={72}>Last 3 days</option>
            <option value={168}>Last 7 days</option>
          </select>
          <button
            onClick={() => mutateHeatmap()}
            className="p-1.5 hover:bg-section rounded-lg text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[360px] rounded-2xl bg-section animate-pulse" />
      ) : error ? (
        <div className="py-10 text-center">
          <AlertTriangle className="w-7 h-7 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">Failed to load heatmap data</p>
          <button
            onClick={() => mutateHeatmap()}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : (
        <ZoneHeatmapMap activityPoints={data?.activity_points || []} violationPoints={data?.violation_points || []} />
      )}
    </div>
  );
}
