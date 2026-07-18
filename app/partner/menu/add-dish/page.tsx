"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import AddDishForm from "@/components/partner/menu/AddDishForm";
import DishPreviewCard from "@/components/partner/menu/DishPreviewCard";
import { DishState, initialDishState } from "@/components/partner/menu/types";
import { createPartnerDish, updatePartnerDish, fetchPartnerMenu } from "@/services/partnerApi";

function AddDishContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [dish, setDish] = useState<DishState>(initialDishState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const menu = await fetchPartnerMenu();
        const item = menu.items.find((i) => i.id === editId);
        if (!item || cancelled) return;
        setDish({
          ...initialDishState,
          image: item.image_url || null,
          name: item.name,
          shortDesc: item.description || "",
          longDesc: item.description || "",
          category: item.category_name || "",
          foodType: item.is_vegetarian ? "Veg" : "Non-Veg",
          regularPrice: Number(item.price),
          discountPrice: Number(item.discount_price || 0),
          availability: item.is_available === false ? "Out of Stock" : "Available",
          badges: {
            ...initialDishState.badges,
            bestseller: Boolean(item.is_bestseller),
            trending: Boolean(item.is_trending),
          },
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const handlePublish = async (state: DishState) => {
    setSaving(true);
    setError("");
    try {
      const imageUrl =
        state.image && !state.image.startsWith("blob:")
          ? state.image
          : null;

      const payload = {
        name: state.name.trim(),
        description: state.longDesc || state.shortDesc,
        price: state.regularPrice,
        discount_price: state.discountPrice || null,
        image_url: imageUrl,
        category_name: state.category || "Main Course",
        is_veg: state.foodType === "Veg",
        is_vegetarian: state.foodType === "Veg",
        is_available: state.availability === "Available",
        is_trending: state.badges.trending,
        is_bestseller: state.badges.bestseller,
        preparation_time: parseInt(state.prepTime, 10) || 15,
        calories: parseInt(state.calories, 10) || null,
      };

      if (editId) {
        await updatePartnerDish(editId, payload);
      } else {
        await createPartnerDish(payload);
      }
      router.push("/partner/menu");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to save dish");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF] font-bold uppercase tracking-wider mb-4">
          <Link href="/partner/dashboard" className="hover:text-[#FC8019] transition-colors">Dashboard</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/partner/menu" className="hover:text-[#FC8019] transition-colors">Menu Management</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#111827]">{editId ? "Edit Dish" : "Add New Dish"}</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-[#111827] mb-2 flex items-center gap-3">
          {editId ? "Edit Dish" : "Add New Dish"}
        </h1>
        <p className="text-[#6B7280]">
          Create and manage delicious menu items for your restaurant.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="w-full xl:w-[65%]">
          <AddDishForm
            dish={dish}
            setDish={setDish}
            onPublish={handlePublish}
            saving={saving}
          />
        </div>
        <div className="w-full xl:w-[35%] xl:relative">
          <DishPreviewCard dish={dish} />
        </div>
      </div>
    </div>
  );
}

export default function AddDishPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#FC8019] selection:text-white">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Suspense fallback={<p className="text-[#6B7280] text-center py-20">Loading…</p>}>
            <AddDishContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
