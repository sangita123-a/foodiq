"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AddressesHeader from "@/components/addresses/AddressesHeader";
import AddressCard, { AddressType } from "@/components/addresses/AddressCard";
import AddressFormModal from "@/components/addresses/AddressFormModal";
import AddressesEmptyState from "@/components/addresses/AddressesEmptyState";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";

function SavedAddressesContent() {
  const hasToken = useAuthToken();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { data, mutate, isLoading, error } = useSWR(hasToken ? "/api/addresses" : null);
  const addressesData = data || [];
  const { showToast } = useToast();

  const addresses: AddressType[] = addressesData.map((addr: Record<string, unknown>) => ({
    id: String(addr.id),
    name: String(addr.full_name || "User"),
    phone: String(addr.phone_number || ""),
    flat: String(addr.house_no || ""),
    street: String(addr.street || ""),
    landmark: String(addr.landmark || ""),
    city: String(addr.city || ""),
    state: String(addr.state || ""),
    pincode: String(addr.zip_code || ""),
    type: (addr.address_type as AddressType["type"]) || "Home",
    isDefault: Boolean(addr.is_default),
  }));

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(null);

  useEffect(() => {
    if (!editId || !data || !Array.isArray(data) || data.length === 0) return;
    const match = addresses.find((a) => a.id === editId);
    if (match) {
      setEditingAddress(match);
      setIsModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once when edit id + data arrive
  }, [editId, data]);

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: AddressType) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/addresses/${id}`);
      mutate();
      showToast("Address deleted", "success");
    } catch {
      showToast("Failed to delete address", "error");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const addr = addresses.find((a) => a.id === id);
      if (!addr) return;
      await api.put(`/api/addresses/${id}`, {
        address_type: addr.type,
        full_name: addr.name,
        phone_number: addr.phone,
        house_no: addr.flat,
        street: addr.street,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        zip_code: addr.pincode,
        is_default: true,
      });
      mutate();
      showToast("Default address updated", "success");
    } catch {
      showToast("Failed to update default address", "error");
    }
  };

  const handleSave = async (address: AddressType) => {
    try {
      const payload = {
        address_type: address.type,
        full_name: address.name,
        phone_number: address.phone,
        house_no: address.flat,
        street: address.street,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        zip_code: address.pincode,
        is_default: address.isDefault,
      };

      if (editingAddress) {
        await api.put(`/api/addresses/${editingAddress.id}`, payload);
        showToast("Address updated", "success");
      } else {
        await api.post(`/api/addresses`, payload);
        showToast("Address added", "success");
      }
      mutate();
      setIsModalOpen(false);
    } catch {
      showToast("Failed to save address", "error");
    }
  };

  const filteredAddresses = addresses.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="w-48 h-8 bg-section animate-pulse rounded-lg mb-2" />
            <div className="w-64 h-5 bg-section animate-pulse rounded-lg" />
          </div>
          <div className="w-32 h-10 bg-section animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-section animate-pulse rounded-2xl border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="text-foreground text-xl">Failed to load addresses</div>
        <button type="button" onClick={() => mutate()} className="px-6 py-2 bg-primary text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        <AddressesHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} onAddNew={handleAddNew} />

        {filteredAddresses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAddresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <AddressesEmptyState onAddNew={handleAddNew} />
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddressFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            initialData={editingAddress}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function SavedAddressesPage() {
  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <Suspense fallback={<div className="text-foreground text-center py-20">Loading addresses...</div>}>
        <SavedAddressesContent />
      </Suspense>
      <Footer />
    </main>
  );
}
