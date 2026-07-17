"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Home, Briefcase, Edit2, Trash2, Star } from "lucide-react";
import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import AddressFormModal from "@/components/addresses/AddressFormModal";
import { AddressType } from "@/components/addresses/AddressCard";

export default function SavedAddresses() {
  const { data, mutate, isLoading } = useSWR("/api/addresses");
  const addressesData = data || [];
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AddressType | null>(null);

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
    isDefault: addr.is_default,
  }));

  const openAdd = () => {
    setEditing(null);
    setIsModalOpen(true);
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
      if (editing) {
        await api.put(`/api/addresses/${editing.id}`, payload);
        showToast("Address updated", "success");
      } else {
        await api.post("/api/addresses", payload);
        showToast("Address added", "success");
      }
      mutate();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/addresses/${id}`);
      mutate();
      showToast("Address deleted", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const handleSetDefault = async (addr: AddressType) => {
    try {
      await api.put(`/api/addresses/${addr.id}`, {
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
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to set default", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]">
        <div className="h-8 w-48 bg-[#F8FAFC] animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-[#F8FAFC] animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border border-[#E5E7EB]"
    >
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-[#111827]">Saved Addresses</h2>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary hover:bg-[#E76F0B] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={openAdd}
          className="border-2 border-dashed border-[#E5E7EB] rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group h-full min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            <Plus className="w-6 h-6 text-[#6B7280] group-hover:text-primary" />
          </div>
          <p className="text-[#6B7280] font-bold group-hover:text-[#111827] transition-colors">Add New Address</p>
        </div>

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-white rounded-2xl p-6 border border-[#E5E7EB] hover:border-[#E5E7EB] transition-colors relative group flex flex-col h-full min-h-[160px]"
          >
            {addr.isDefault && (
              <span className="absolute top-4 right-4 bg-[#F8FAFC] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Default
              </span>
            )}

            <div className="flex items-center gap-2 mb-3">
              {addr.type === "Home" ? (
                <Home className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <Briefcase className="w-5 h-5 text-[#6B7280]" />
              )}
              <h3 className="text-lg font-bold text-[#111827]">{addr.type}</h3>
            </div>

            <p className="text-[#6B7280] text-sm leading-relaxed mb-6 flex-1">
              {[addr.flat, addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
            </p>

            <div className="flex gap-4 border-t border-[#E5E7EB] pt-4 flex-wrap">
              <button
                onClick={() => {
                  setEditing(addr);
                  setIsModalOpen(true);
                }}
                className="text-[#6B7280] hover:text-[#111827] text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                className="text-[#6B7280] hover:text-red-500 text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr)}
                  className="text-[#6B7280] hover:text-yellow-400 text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Star className="w-4 h-4" /> Set Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddressFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            initialData={editing}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
