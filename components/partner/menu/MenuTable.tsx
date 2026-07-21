"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, PlusCircle, 
  Eye, Edit2, Copy, Trash2, CheckCircle2, XCircle, EyeOff,
  ChevronLeft, ChevronRight
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { formatRelativeTime } from "@/services/partnerApi";

export type MenuTableDish = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  status: string;
  orders: number;
  updated: string;
  image: string;
};

type MenuTableProps = {
  dishes?: MenuTableDish[];
  categories?: string[];
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkStatus?: (ids: string[], status: string) => void;
};

export default function MenuTable({
  dishes: dishesProp,
  categories = [],
  onStatusChange,
  onDelete,
  onBulkDelete,
  onBulkStatus,
}: MenuTableProps) {
  const [dishes, setDishes] = useState<MenuTableDish[]>(dishesProp || []);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (dishesProp) setDishes(dishesProp);
  }, [dishesProp]);

  const categoryOptions = useMemo(() => {
    const fromData = Array.from(new Set(dishes.map((d) => d.category).filter(Boolean)));
    return categories.length ? categories : fromData;
  }, [dishes, categories]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || dish.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || dish.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [dishes, search, categoryFilter, statusFilter]);

  const paginatedDishes = filteredDishes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage) || 1;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedDishes.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const changeStatus = (id: string, newStatus: string) => {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    onStatusChange?.(id, newStatus);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    setDishes(prev => prev.filter(d => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
    onBulkDelete?.(ids);
  };

  const handleBulkStatus = (newStatus: string) => {
    const ids = Array.from(selectedIds);
    setDishes(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, status: newStatus } : d));
    setSelectedIds(new Set());
    onBulkStatus?.(ids, newStatus);
  };

  const handleDelete = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
    onDelete?.(id);
  };

  return (
    <div className="bg-background rounded-3xl border border-border shadow-2xl overflow-hidden relative">
      
      <div className="p-6 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-section">
        
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-section border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-auto bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-auto bg-section border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>

        <Link
          href="/partner/menu/add-dish"
          className="w-full xl:w-auto bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" /> Add New Dish
        </Link>

      </div>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center justify-between overflow-hidden"
          >
            <span className="text-primary font-bold text-sm">
              {selectedIds.size} {selectedIds.size === 1 ? 'dish' : 'dishes'} selected
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleBulkStatus("Available")} className="bg-section hover:bg-section border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Mark Available</button>
              <button type="button" onClick={() => handleBulkStatus("Out of Stock")} className="bg-section hover:bg-section border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Mark Out of Stock</button>
              <button type="button" onClick={handleBulkDelete} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Delete Selected</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-section border-b border-border">
              <th className="p-4 pl-6 w-12">
                <input 
                  type="checkbox" 
                  checked={paginatedDishes.length > 0 && selectedIds.size === paginatedDishes.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary focus:ring-offset-[#FFFFFF]"
                />
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Dish</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Price</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Orders</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedDishes.map((dish) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={dish.id} 
                  className={`border-b border-border group transition-colors ${selectedIds.has(dish.id) ? 'bg-primary/5' : 'hover:bg-section'}`}
                >
                  <td className="p-4 pl-6">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(dish.id)}
                      onChange={() => handleSelectRow(dish.id)}
                      className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary focus:ring-offset-[#FFFFFF]"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        <SafeImage src={dish.image} fallback={FOOD_FALLBACK} alt={dish.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-foreground font-bold text-sm">{dish.name}</p>
                        <p className="text-[#9CA3AF] text-xs mt-0.5">Rating: ⭐ {dish.rating}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-section border border-border px-3 py-1 rounded-full text-xs text-gray-text">{dish.category || "Uncategorized"}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-foreground font-bold">₹{dish.price}</span>
                  </td>
                  <td className="p-4">
                    <div className="relative group/status inline-block">
                      <button type="button" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
                        ${dish.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                        ${dish.status === 'Out of Stock' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                        ${dish.status === 'Hidden' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                      `}>
                        {dish.status === 'Available' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {dish.status === 'Out of Stock' && <XCircle className="w-3.5 h-3.5" />}
                        {dish.status === 'Hidden' && <EyeOff className="w-3.5 h-3.5" />}
                        {dish.status}
                      </button>
                      
                      <div className="absolute top-full left-0 mt-2 w-36 bg-section border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-20 py-1">
                        <button type="button" onClick={() => changeStatus(dish.id, "Available")} className="w-full text-left px-4 py-2 text-xs text-gray-text hover:bg-section hover:text-foreground transition-colors">Available</button>
                        <button type="button" onClick={() => changeStatus(dish.id, "Out of Stock")} className="w-full text-left px-4 py-2 text-xs text-gray-text hover:bg-section hover:text-foreground transition-colors">Out of Stock</button>
                        <button type="button" onClick={() => changeStatus(dish.id, "Hidden")} className="w-full text-left px-4 py-2 text-xs text-gray-text hover:bg-section hover:text-foreground transition-colors">Hidden</button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-text text-sm">{dish.orders}</p>
                    <p className="text-[#9CA3AF] text-xs">Updated {dish.updated}</p>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Link href={`/partner/menu/add-dish?edit=${dish.id}`} className="w-8 h-8 rounded-lg bg-section hover:bg-section border border-border flex items-center justify-center text-gray-text hover:text-foreground transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/partner/menu/add-dish?edit=${dish.id}`} className="w-8 h-8 rounded-lg bg-section hover:bg-primary/20 border border-border hover:border-primary/30 flex items-center justify-center text-gray-text hover:text-primary transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button type="button" className="w-8 h-8 rounded-lg bg-section hover:bg-section border border-border flex items-center justify-center text-gray-text hover:text-foreground transition-colors" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(dish.id)} className="w-8 h-8 rounded-lg bg-section hover:bg-red-500/20 border border-border hover:border-red-500/30 flex items-center justify-center text-gray-text hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {paginatedDishes.length === 0 && (
          <div className="py-20 text-center text-[#9CA3AF]">
            No dishes found matching your criteria.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-section flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          Showing {filteredDishes.length === 0 ? 0 : Math.min(filteredDishes.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredDishes.length, currentPage * itemsPerPage)} of {filteredDishes.length} dishes
        </p>
        
        <div className="flex gap-2">
          <button 
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-2 rounded-lg bg-background border border-border text-gray-text hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            disabled={currentPage === totalPages || filteredDishes.length === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg bg-background border border-border text-gray-text hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
