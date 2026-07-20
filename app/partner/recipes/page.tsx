"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import {
  inventoryFetcher,
  updateRecipe,
  type RecipeRow,
  type InventoryItem,
} from "@/services/partnerInventoryApi";
import { BookOpen, Save } from "lucide-react";

export default function PartnerRecipesPage() {
  const { data: recipes, isLoading } = useSWR<RecipeRow[]>("/api/partner/inventory/recipes", inventoryFetcher);
  const { data: items } = useSWR<InventoryItem[]>("/api/partner/inventory/items", inventoryFetcher);
  const [editing, setEditing] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Array<{ inventory_item_id: string; quantity_required: number; unit: string }>>([]);
  const [busy, setBusy] = useState(false);

  const startEdit = (recipe: RecipeRow) => {
    setEditing(recipe.menu_item_id);
    const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    setIngredients(
      ings.length
        ? ings.map((i) => ({
            inventory_item_id: i.inventory_item_id,
            quantity_required: Number(i.quantity_required),
            unit: i.unit || "pieces",
          }))
        : [{ inventory_item_id: "", quantity_required: 1, unit: "pieces" }]
    );
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await updateRecipe(
        editing,
        ingredients.filter((i) => i.inventory_item_id)
      );
      setEditing(null);
      mutate("/api/partner/inventory/recipes");
      mutate("/api/partner/menu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PartnerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#111827] flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-[#E23744]" /> Recipe Management
              </h1>
              <p className="text-[#6B7280]">Link menu items to ingredients. Stock auto-deducts on orders.</p>
            </div>

            {isLoading && <p className="text-sm text-[#6B7280]">Loading recipes…</p>}

            <div className="space-y-4">
              {(recipes || []).map((recipe) => (
                <div key={recipe.menu_item_id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-[#111827]">{recipe.menu_item_name}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        ₹{Number(recipe.price).toFixed(0)} ·{" "}
                        {recipe.is_available === false ? "Out of stock (auto)" : "Available"}
                      </p>
                    </div>
                    {editing !== recipe.menu_item_id && (
                      <button
                        type="button"
                        onClick={() => startEdit(recipe)}
                        className="text-xs font-bold text-[#E23744]"
                      >
                        Edit Recipe
                      </button>
                    )}
                  </div>

                  {editing === recipe.menu_item_id ? (
                    <div className="space-y-2">
                      {ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 flex-wrap">
                          <select
                            value={ing.inventory_item_id}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx].inventory_item_id = e.target.value;
                              setIngredients(next);
                            }}
                            className="flex-1 min-w-[140px] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
                          >
                            <option value="">Select ingredient</option>
                            {(items || []).map((it) => (
                              <option key={it.id} value={it.id}>{it.name} ({it.quantity} {it.unit})</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            value={ing.quantity_required}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx].quantity_required = Number(e.target.value);
                              setIngredients(next);
                            }}
                            className="w-24 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
                          />
                          <input
                            value={ing.unit}
                            onChange={(e) => {
                              const next = [...ingredients];
                              next[idx].unit = e.target.value;
                              setIngredients(next);
                            }}
                            className="w-24 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
                            placeholder="unit"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIngredients([...ingredients, { inventory_item_id: "", quantity_required: 1, unit: "pieces" }])}
                          className="text-xs font-bold text-[#6B7280]"
                        >
                          + Add ingredient
                        </button>
                        <button type="button" onClick={save} disabled={busy} className="ml-auto bg-[#E23744] text-white font-black px-4 py-2 rounded-xl text-sm flex items-center gap-1">
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="text-sm text-[#6B7280]">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <ul className="text-sm text-[#6B7280] space-y-1">
                      {(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).length ? (
                        recipe.ingredients.map((i, idx) => (
                          <li key={idx}>
                            {i.quantity_required} {i.unit} {i.ingredient_name}
                            {i.available_qty != null && (
                              <span className="text-[#9CA3AF]"> (stock: {i.available_qty})</span>
                            )}
                          </li>
                        ))
                      ) : (
                        <li className="italic">No recipe defined</li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
