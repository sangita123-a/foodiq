"use client";

import { useState, useRef, ChangeEvent, useMemo } from "react";
import { motion } from "framer-motion";
import { Upload, X, Plus, Info, AlertCircle, Percent, ArrowRight } from "lucide-react";
import { DishState, DishCustomization } from "./types";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

interface AddDishFormProps {
  dish: DishState;
  setDish: React.Dispatch<React.SetStateAction<DishState>>;
}

export default function AddDishForm({ dish, setDish }: AddDishFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed Values
  const profitMargin = useMemo(() => {
    if (!dish.costPrice) return null;
    const selling = dish.discountPrice > 0 ? dish.discountPrice : dish.regularPrice;
    if (!selling) return null;
    const profit = selling - dish.costPrice;
    const margin = (profit / selling) * 100;
    return margin.toFixed(1);
  }, [dish.costPrice, dish.regularPrice, dish.discountPrice]);

  // Handlers
  const handleChange = (field: keyof DishState, value: any) => {
    setDish(prev => ({ ...prev, [field]: value }));
  };

  const handleBadgeChange = (badge: keyof DishState["badges"]) => {
    setDish(prev => ({
      ...prev,
      badges: { ...prev.badges, [badge]: !prev.badges[badge] }
    }));
  };

  // Image Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }
    const url = URL.createObjectURL(file);
    handleChange("image", url);
  };

  // Customization Handlers
  const addCustomization = () => {
    const newCust: DishCustomization = { id: Date.now().toString(), name: "", price: 0 };
    handleChange("customizations", [...dish.customizations, newCust]);
  };

  const updateCustomization = (id: string, field: keyof DishCustomization, value: string | number) => {
    const updated = dish.customizations.map(c => c.id === id ? { ...c, [field]: value } : c);
    handleChange("customizations", updated);
  };

  const removeCustomization = (id: string) => {
    handleChange("customizations", dish.customizations.filter(c => c.id !== id));
  };

  // Validation
  const isFormValid = dish.name.trim() !== "" && dish.shortDesc.trim() !== "" && dish.category !== "";

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    if (isFormValid) {
      // API call would go here
      alert("Dish Published Successfully!");
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form className="space-y-8" onSubmit={handlePublish}>
      
      {/* 1. Image Upload Section */}
      <section className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl">
        <h3 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
          Dish Image
        </h3>
        
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
            ${dragActive ? 'border-[#FC8019] bg-[#FC8019]/5' : 'border-[#E5E7EB] bg-[#F8FAFC] hover:border-[#E5E7EB]'}
            ${showValidation && !dish.image ? 'border-red-500/50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            onChange={handleFileChange}
            className="hidden" 
          />

          {dish.image ? (
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#E5E7EB] mb-4 shadow-lg">
                <SafeImage src={dish.image} fallback={FOOD_FALLBACK} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => handleChange("image", null)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#FC8019] font-bold text-sm hover:text-[#111827] transition-colors"
              >
                Replace Image
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-[#6B7280]" />
              </div>
              <p className="text-[#111827] font-bold mb-2">Drag & drop an image here, or <span className="text-[#FC8019] pointer-events-auto cursor-pointer" onClick={() => fileInputRef.current?.click()}>browse</span></p>
              <p className="text-[#9CA3AF] text-xs font-bold uppercase tracking-wider">JPG, PNG, WEBP (Max 5MB)</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Basic Information */}
      <section className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Dish Name *</label>
          <input 
            type="text" 
            value={dish.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Hyderabadi Dum Biryani"
            className={`w-full bg-[#F8FAFC] text-[#111827] border rounded-xl px-4 py-3 focus:outline-none transition-colors
              ${showValidation && !dish.name ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#FC8019]'}
            `}
          />
          {showValidation && !dish.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Dish Name is required</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-2">Short Description * (Max 100 chars)</label>
          <textarea 
            value={dish.shortDesc}
            onChange={(e) => handleChange("shortDesc", e.target.value)}
            maxLength={100}
            rows={2}
            placeholder="A punchy, tempting description for the menu card."
            className={`w-full bg-[#F8FAFC] text-[#111827] border rounded-xl px-4 py-3 focus:outline-none transition-colors resize-none
              ${showValidation && !dish.shortDesc ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#FC8019]'}
            `}
          />
          {showValidation && !dish.shortDesc && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Short description is required</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Category *</label>
            <select 
              value={dish.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`w-full bg-[#F8FAFC] text-[#111827] border rounded-xl px-4 py-3 focus:outline-none transition-colors appearance-none cursor-pointer
                ${showValidation && !dish.category ? 'border-red-500 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#FC8019]'}
              `}
            >
              <option value="" disabled>Select Category</option>
              <option value="Main Course">Main Course</option>
              <option value="Breads">Breads</option>
              <option value="Starters">Starters</option>
              <option value="Desserts">Desserts</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Food Type</label>
            <div className="flex bg-[#F8FAFC] rounded-xl p-1 border border-[#E5E7EB] h-[50px]">
              {["Veg", "Non-Veg", "Egg"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange("foodType", dish.foodType === type ? "" : type)}
                  className={`flex-1 rounded-lg text-sm font-bold transition-colors ${
                    dish.foodType === type 
                      ? (type === 'Veg' ? 'bg-green-500/20 text-green-400' : type === 'Non-Veg' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')
                      : 'text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pricing */}
      <section className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Regular Price (₹)</label>
            <input 
              type="number" 
              value={dish.regularPrice || ""}
              onChange={(e) => handleChange("regularPrice", parseFloat(e.target.value))}
              className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FC8019] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Discount Price (₹)</label>
            <input 
              type="number" 
              value={dish.discountPrice || ""}
              onChange={(e) => handleChange("discountPrice", parseFloat(e.target.value))}
              className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FC8019] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#6B7280] mb-2">Cost Price (₹)</label>
            <input 
              type="number" 
              value={dish.costPrice || ""}
              onChange={(e) => handleChange("costPrice", parseFloat(e.target.value))}
              placeholder="Optional"
              className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FC8019] transition-colors"
            />
          </div>
        </div>

        {profitMargin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex items-center gap-3 ${parseFloat(profitMargin) > 30 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}
          >
            <Percent className="w-5 h-5" />
            <div>
              <p className="font-bold">Estimated Profit Margin: {profitMargin}%</p>
              <p className="text-xs opacity-80">Based on selling price vs cost price.</p>
            </div>
          </motion.div>
        )}
      </section>

      {/* 4. Details & Spice */}
      <section className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">Details & Properties</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Serving Size</label>
            <input type="text" placeholder="e.g. 2 Persons" value={dish.servingSize} onChange={e => handleChange("servingSize", e.target.value)} className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm focus:border-[#FC8019] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Prep Time</label>
            <input type="text" placeholder="e.g. 20 Mins" value={dish.prepTime} onChange={e => handleChange("prepTime", e.target.value)} className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm focus:border-[#FC8019] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Calories</label>
            <input type="text" placeholder="e.g. 450" value={dish.calories} onChange={e => handleChange("calories", e.target.value)} className="w-full bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-xl px-4 py-2 text-sm focus:border-[#FC8019] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Spice Level</label>
            <input 
              type="range" 
              min="1" max="4" step="1"
              value={dish.spiceLevel}
              onChange={(e) => handleChange("spiceLevel", parseInt(e.target.value))}
              className="w-full h-2 bg-[#F8FAFC] rounded-lg appearance-none cursor-pointer accent-[#FC8019]"
            />
            <div className="flex justify-between text-xs mt-1 text-[#9CA3AF]">
              <span>Mild</span><span>Extra</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Customization */}
      <section className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">Customizations</h3>
          <button type="button" onClick={addCustomization} className="text-[#FC8019] font-bold text-sm hover:text-[#111827] transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4"/> Add Option
          </button>
        </div>
        
        {dish.customizations.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-[#E5E7EB] rounded-xl">
            <p className="text-[#9CA3AF] text-sm">No customization options added. Add toppings, add-ons, or variants.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dish.customizations.map((cust, index) => (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={cust.id} className="flex gap-3 items-center">
                <input 
                  type="text" 
                  placeholder="Option Name (e.g. Extra Cheese)" 
                  value={cust.name}
                  onChange={(e) => updateCustomization(cust.id, "name", e.target.value)}
                  className="flex-1 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:border-[#FC8019] outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Additional Price (₹)" 
                  value={cust.price || ""}
                  onChange={(e) => updateCustomization(cust.id, "price", parseFloat(e.target.value))}
                  className="w-32 bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:border-[#FC8019] outline-none"
                />
                <button type="button" onClick={() => removeCustomization(cust.id)} className="p-2 text-[#9CA3AF] hover:text-red-500 transition-colors">
                  <X className="w-5 h-5"/>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Settings & Badges */}
      <section className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl space-y-6">
        <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">Settings & Badges</h3>
        
        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-3">Promotional Badges</label>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'bestseller', label: "Bestseller", color: "hover:border-yellow-500 hover:text-yellow-500", active: "border-yellow-500 bg-yellow-500/10 text-yellow-500" },
              { key: 'chefsSpecial', label: "Chef's Special", color: "hover:border-red-500 hover:text-red-500", active: "border-red-500 bg-red-500/10 text-red-500" },
              { key: 'healthyChoice', label: "Healthy Choice", color: "hover:border-green-500 hover:text-green-500", active: "border-green-500 bg-green-500/10 text-green-500" },
              { key: 'newArrival', label: "New Arrival", color: "hover:border-blue-500 hover:text-blue-500", active: "border-blue-500 bg-blue-500/10 text-blue-500" }
            ].map(badge => {
              const isActive = dish.badges[badge.key as keyof DishState["badges"]];
              return (
                <button
                  key={badge.key}
                  type="button"
                  onClick={() => handleBadgeChange(badge.key as keyof DishState["badges"])}
                  className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${isActive ? badge.active : `border-[#E5E7EB] text-[#6B7280] bg-[#F8FAFC] ${badge.color}`}`}
                >
                  {badge.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#6B7280] mb-3">Availability Status</label>
          <div className="flex bg-[#F8FAFC] rounded-xl p-1 border border-[#E5E7EB]">
            {["Available", "Out of Stock", "Hidden"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleChange("availability", status)}
                className={`flex-1 rounded-lg text-sm font-bold py-2 transition-colors ${
                  dish.availability === status 
                    ? (status === 'Available' ? 'bg-green-500/20 text-green-400' : status === 'Out of Stock' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')
                    : 'text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F8FAFC]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
        <button type="button" className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-[#6B7280] bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] transition-colors">
          Cancel
        </button>
        <button type="button" className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold text-[#111827] bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E5E7EB] transition-colors">
          Save Draft
        </button>
        <button 
          type="submit" 
          disabled={showValidation && !isFormValid}
          className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-white bg-[#FC8019] hover:bg-[#E66F0D] transition-colors shadow-[0_0_20px_rgba(252,128,25,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          Publish Dish <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </form>
  );
}
