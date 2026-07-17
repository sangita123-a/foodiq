"use client";

import { useState } from "react";
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

export default function SavedAddressesPage() {
  const { data, mutate, isLoading, error } = useSWR('/api/addresses');
  const addressesData = data || [];
  const { showToast } = useToast();
  
  // Map backend model to frontend model
  const addresses: AddressType[] = addressesData.map((addr: any) => ({
    id: addr.id,
    name: addr.full_name || "User",
    phone: addr.phone_number || "",
    flat: addr.house_no || "",
    street: addr.street || "",
    landmark: addr.landmark || "",
    city: addr.city,
    state: addr.state,
    pincode: addr.zip_code,
    type: addr.address_type,
    isDefault: addr.is_default
  }));

  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(null);

  // Handlers
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
    } catch (err) {
      console.error(err);
      showToast("Failed to delete address", "error");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Find the address
      const addr = addresses.find(a => a.id === id);
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
        is_default: true
      });
      mutate();
      showToast("Default address updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to set default address", "error");
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
        is_default: address.isDefault
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
    } catch (err) {
      console.error("Failed to save address", err);
      showToast("Failed to save address", "error");
    }
  };

  // Filter Logic
  const filteredAddresses = addresses.filter(a => {
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
      <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <div className="w-48 h-8 bg-[#F8FAFC] animate-pulse rounded-lg mb-2"></div>
              <div className="w-64 h-5 bg-[#F8FAFC] animate-pulse rounded-lg"></div>
            </div>
            <div className="w-32 h-10 bg-[#F8FAFC] animate-pulse rounded-lg"></div>
          </div>
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-[#F8FAFC] animate-pulse rounded-2xl border border-[#E5E7EB]"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Failed to load addresses</div>
        <button onClick={() => mutate()} className="px-6 py-2 bg-primary text-white rounded-lg">Retry</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        
        <AddressesHeader 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onAddNew={handleAddNew}
        />

        {filteredAddresses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAddresses.map(address => (
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

      <Footer />

      {/* Reusable Modal for Add & Edit */}
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
    </main>
  );
}
