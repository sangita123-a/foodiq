"use client";

import { useState, useEffect } from "react";
import { Ticket, Trash2, Plus, Percent, IndianRupee } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: Number(discountValue),
          minOrderValue: minOrderValue ? Number(minOrderValue) : null,
          expiryDate: expiryDate || null,
        }),
      });
      
      if (res.ok) {
        // Reset form
        setCode("");
        setDiscountValue("");
        setMinOrderValue("");
        setExpiryDate("");
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create coupon", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error("Failed to delete coupon", error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Promotions & Coupons</h1>
        <p className="mt-2 text-sm text-gray-600">Create and manage discount codes for your customers.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Create Coupon Form */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center text-lg font-semibold text-gray-900">
              <Plus className="mr-2 h-5 w-5 text-primary" />
              Create New Coupon
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 uppercase shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      {discountType === 'PERCENTAGE' ? (
                        <Percent className="h-4 w-4 text-gray-400" />
                      ) : (
                        <IndianRupee className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Cart Value (Optional)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 sm:text-sm"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Creating..." : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>

        {/* Active Coupons List */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
                <Ticket className="mr-2 h-5 w-5 text-gray-400" />
                Active Coupons
              </h3>
            </div>
            <ul role="list" className="divide-y divide-gray-100">
              {loading ? (
                <li className="px-6 py-8 text-center text-sm text-gray-500">Loading coupons...</li>
              ) : coupons.length === 0 ? (
                <li className="px-6 py-8 text-center text-sm text-gray-500">No coupons created yet.</li>
              ) : (
                coupons.map((coupon) => (
                  <li key={coupon.id} className="flex items-center justify-between gap-x-6 px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-start gap-x-3">
                        <p className="text-sm font-bold leading-6 text-gray-900 uppercase tracking-wide">
                          {coupon.code}
                        </p>
                        <p className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${coupon.isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/10'}`}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                        <p className="truncate">
                          Discount: <span className="font-semibold text-gray-900">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</span>
                        </p>
                        {coupon.minOrderValue && (
                          <>
                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                            <p className="truncate">Min Order: ₹{coupon.minOrderValue}</p>
                          </>
                        )}
                        {coupon.expiryDate && (
                          <>
                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                            <p className="truncate">Expires: {new Date(coupon.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-x-4">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 transition-colors"
                      >
                        <span className="sr-only">Delete</span>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
