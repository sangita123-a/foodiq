"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Search,
  Trash2,
  Edit3,
  UserPlus,
  Users,
  Layers,
  Circle,
  Square,
  Activity,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
  Shield,
  X,
  AlertTriangle,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { isClientAuthenticated } from "@/lib/authSession";
import { getAccessToken } from "@/lib/accessToken";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  polygon?: any;
  center_latitude?: number;
  center_longitude?: number;
  radius_km?: number;
  zone_type: "polygon" | "circle";
  is_active: boolean;
  assigned_partners_count?: number;
  created_at: string;
}

export default function AdminDeliveryZonesPage() {
  const router = useRouter();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<DeliveryZone | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Bangalore");
  const [formState, setFormState] = useState("Karnataka");
  const [formZoneType, setFormZoneType] = useState<"polygon" | "circle">("polygon");
  const [formRadiusKm, setFormRadiusKm] = useState("5");
  const [formCenterLat, setFormCenterLat] = useState("12.9716");
  const [formCenterLng, setFormCenterLng] = useState("77.5946");
  const [formPolygonPoints, setFormPolygonPoints] = useState(
    "12.9716, 77.5946\n12.9800, 77.6000\n12.9600, 77.6100"
  );
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Partner Assignment State
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/admin/login");
    }
  }, [router]);

  // Fetch Delivery Zones
  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search ? { search } : {}),
      });

      const res = await fetch(`/api/admin/delivery-zones?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setZones(json.data || []);
        setTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch delivery zones", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Real-time socket updates for zone changes
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.DELIVERY_ZONE_CHANGED, () => {
        fetchZones();
      });
    }
    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.DELIVERY_ZONE_CHANGED);
      }
    };
  }, [fetchZones]);

  // Handle Create/Update Zone
  const handleSubmitZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = getAccessToken();

      let polygonData = null;
      if (formZoneType === "polygon") {
        const lines = formPolygonPoints.trim().split("\n");
        polygonData = lines
          .map((line) => {
            const [lat, lng] = line.split(",").map((s) => parseFloat(s.trim()));
            return !isNaN(lat) && !isNaN(lng) ? [lng, lat] : null; // GeoJSON [lng, lat]
          })
          .filter(Boolean);
      }

      const body = {
        name: formName,
        city: formCity,
        state: formState,
        country: "India",
        zone_type: formZoneType,
        polygon: polygonData,
        center_latitude: parseFloat(formCenterLat),
        center_longitude: parseFloat(formCenterLng),
        radius_km: parseFloat(formRadiusKm),
        is_active: formIsActive,
      };

      const url = editingZone
        ? `/api/admin/delivery-zones/${editingZone.id}`
        : "/api/admin/delivery-zones";

      const method = editingZone ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setEditingZone(null);
        resetForm();
        fetchZones();
      } else {
        const errJson = await res.json();
        alert(errJson.message || "Failed to save delivery zone");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving delivery zone");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Zone
  const handleDeleteZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return;
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/admin/delivery-zones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchZones();
      }
    } catch (err) {
      console.error("Failed to delete zone", err);
    }
  };

  // Assign Partner to Zone
  const handleAssignPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal || !partnerIdInput) return;
    try {
      setAssigning(true);
      const token = getAccessToken();
      const res = await fetch(
        `/api/admin/delivery-zones/${showAssignModal.id}/assign-partner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ partner_id: partnerIdInput }),
        }
      );

      if (res.ok) {
        setShowAssignModal(null);
        setPartnerIdInput("");
        fetchZones();
      } else {
        const errJson = await res.json();
        alert(errJson.message || "Failed to assign partner");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning partner");
    } finally {
      setAssigning(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCity("Bangalore");
    setFormState("Karnataka");
    setFormZoneType("polygon");
    setFormRadiusKm("5");
    setFormCenterLat("12.9716");
    setFormCenterLng("77.5946");
    setFormPolygonPoints("12.9716, 77.5946\n12.9800, 77.6000\n12.9600, 77.6100");
    setFormIsActive(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormName(zone.name);
    setFormCity(zone.city);
    setFormState(zone.state || "");
    setFormZoneType(zone.zone_type);
    setFormRadiusKm(zone.radius_km ? zone.radius_km.toString() : "5");
    setFormCenterLat(zone.center_latitude ? zone.center_latitude.toString() : "12.9716");
    setFormCenterLng(zone.center_longitude ? zone.center_longitude.toString() : "77.5946");
    setFormIsActive(zone.is_active);
    setShowCreateModal(true);
  };

  return (
    <AdminShell title="Geo-fencing & Delivery Zones">
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search delivery zones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchZones}
              className="p-2 hover:bg-section rounded-xl border border-border transition-colors text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setEditingZone(null);
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Draw / Add Zone
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Zones
            </span>
            <h3 className="text-2xl font-bold text-foreground mt-1">{total}</h3>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Polygons
            </span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {zones.filter((z) => z.zone_type === "polygon" && z.is_active).length}
            </h3>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Circles
            </span>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">
              {zones.filter((z) => z.zone_type === "circle" && z.is_active).length}
            </h3>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Assigned Riders
            </span>
            <h3 className="text-2xl font-bold text-purple-600 mt-1">
              {zones.reduce((acc, z) => acc + (z.assigned_partners_count || 0), 0)}
            </h3>
          </div>
        </div>

        {/* Zones Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading delivery zones...
            </div>
          ) : zones.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No delivery zones found. Click &quot;Add Zone&quot; to define a polygon or circle region.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-section border-b border-border text-xs uppercase text-muted-foreground font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Zone Name</th>
                    <th className="px-6 py-3.5">City / Region</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Riders Assigned</th>
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
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600">
                          <Users className="w-3 h-3" />
                          {zone.assigned_partners_count || 0} Riders
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
                            onClick={() => setShowAssignModal(zone)}
                            className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-purple-600"
                            title="Assign Rider"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(zone)}
                            className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-primary"
                            title="Edit Zone"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone.id)}
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

          {/* Pagination Footer */}
          {total > limit && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} zones
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold px-3 py-1 bg-section rounded-lg text-foreground">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Zone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
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
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Zone Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Indiranagar & Koramangala Zone"
                  className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                />
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
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Zone Geometry Type
                </label>
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

              {formZoneType === "polygon" ? (
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Polygon Coordinates (Lat, Lng per line)
                  </label>
                  <textarea
                    rows={4}
                    value={formPolygonPoints}
                    onChange={(e) => setFormPolygonPoints(e.target.value)}
                    placeholder="12.9716, 77.5946&#10;12.9800, 77.6000&#10;12.9600, 77.6100"
                    className="w-full px-3 py-2 text-sm font-mono bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Center Lat
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formCenterLat}
                      onChange={(e) => setFormCenterLat(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Center Lng
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formCenterLng}
                      onChange={(e) => setFormCenterLng(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">
                      Radius (km)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formRadiusKm}
                      onChange={(e) => setFormRadiusKm(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-section border border-border rounded-xl focus:outline-none text-foreground"
                    />
                  </div>
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

      {/* Assign Partner Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setShowAssignModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-2">
              Assign Partner to {showAssignModal.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter the partner UUID to grant active delivery privileges for this zone.
            </p>

            <form onSubmit={handleAssignPartner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Delivery Partner UUID
                </label>
                <input
                  type="text"
                  required
                  value={partnerIdInput}
                  onChange={(e) => setPartnerIdInput(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="w-full px-3 py-2 text-sm font-mono bg-section border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-purple-600 text-white font-semibold text-sm rounded-xl hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {assigning ? "Assigning..." : "Assign Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
