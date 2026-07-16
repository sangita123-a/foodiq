"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, PlusCircle, MoreHorizontal, 
  Eye, Edit2, Copy, Trash2, CheckCircle2, XCircle, EyeOff,
  ChevronLeft, ChevronRight
} from "lucide-react";

// --- Mock Dataset ---
const MOCK_DISHES = [
  { id: "d1", name: "Chicken Dum Biryani", category: "Main Course", price: 300, rating: 4.8, status: "Available", orders: 1245, updated: "2 hrs ago", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&q=80" },
  { id: "d2", name: "Paneer Butter Masala", category: "Main Course", price: 250, rating: 4.6, status: "Available", orders: 1102, updated: "1 day ago", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=100&q=80" },
  { id: "d3", name: "Mutton Rogan Josh", category: "Main Course", price: 450, rating: 4.9, status: "Out of Stock", orders: 890, updated: "5 hrs ago", image: "https://images.unsplash.com/photo-1544025162-811114215b01?w=100&q=80" },
  { id: "d4", name: "Garlic Naan", category: "Breads", price: 50, rating: 4.7, status: "Available", orders: 3450, updated: "3 days ago", image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=100&q=80" },
  { id: "d5", name: "Tandoori Roti", category: "Breads", price: 30, rating: 4.5, status: "Available", orders: 2800, updated: "1 week ago", image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=100&q=80" }, // Using same image for mock
  { id: "d6", name: "Gulab Jamun", category: "Desserts", price: 80, rating: 4.9, status: "Hidden", orders: 1560, updated: "2 weeks ago", image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=100&q=80" },
  { id: "d7", name: "Chicken Tikka", category: "Starters", price: 280, rating: 4.7, status: "Available", orders: 980, updated: "4 hrs ago", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=100&q=80" },
  { id: "d8", name: "Diet Coke", category: "Beverages", price: 60, rating: 4.2, status: "Out of Stock", orders: 450, updated: "1 hr ago", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&q=80" },
];

export default function MenuTable() {
  const [dishes, setDishes] = useState(MOCK_DISHES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination (Mocked fixed limit for demo)
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Derived Data
  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      const matchesSearch = dish.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || dish.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || dish.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [dishes, search, categoryFilter, statusFilter]);

  const paginatedDishes = filteredDishes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);

  // Handlers
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
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    setDishes(prev => prev.filter(d => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
  };

  const handleBulkStatus = (newStatus: string) => {
    setDishes(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, status: newStatus } : d));
    setSelectedIds(new Set());
  };

  return (
    <div className="bg-[#171717] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
      
      {/* Top Action Bar */}
      <div className="p-6 border-b border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#1a1a1a]">
        
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-auto bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Main Course">Main Course</option>
            <option value="Breads">Breads</option>
            <option value="Starters">Starters</option>
            <option value="Desserts">Desserts</option>
            <option value="Beverages">Beverages</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-auto bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>

        {/* Primary Action */}
        <button className="w-full xl:w-auto bg-primary hover:bg-[#e02633] text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 flex-shrink-0">
          <PlusCircle className="w-5 h-5" /> Add New Dish
        </button>

      </div>

      {/* Bulk Actions Bar (Sliding Panel) */}
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
              <button onClick={() => handleBulkStatus("Available")} className="bg-[#111] hover:bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Mark Available</button>
              <button onClick={() => handleBulkStatus("Out of Stock")} className="bg-[#111] hover:bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Mark Out of Stock</button>
              <button onClick={handleBulkDelete} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Delete Selected</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#111] border-b border-white/5">
              <th className="p-4 pl-6 w-12">
                <input 
                  type="checkbox" 
                  checked={paginatedDishes.length > 0 && selectedIds.size === paginatedDishes.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-600 bg-transparent text-primary focus:ring-primary focus:ring-offset-[#111]"
                />
              </th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Dish</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
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
                  className={`border-b border-white/5 group transition-colors ${selectedIds.has(dish.id) ? 'bg-primary/5' : 'hover:bg-white/5'}`}
                >
                  <td className="p-4 pl-6">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(dish.id)}
                      onChange={() => handleSelectRow(dish.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-transparent text-primary focus:ring-primary focus:ring-offset-[#171717]"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{dish.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">Rating: ⭐ {dish.rating}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-[#111] border border-white/10 px-3 py-1 rounded-full text-xs text-gray-300">{dish.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-bold">₹{dish.price}</span>
                  </td>
                  <td className="p-4">
                    {/* Status Toggle Dropdown (Simulated via hover or click) */}
                    <div className="relative group/status inline-block">
                      <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
                        ${dish.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                        ${dish.status === 'Out of Stock' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                        ${dish.status === 'Hidden' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : ''}
                      `}>
                        {dish.status === 'Available' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {dish.status === 'Out of Stock' && <XCircle className="w-3.5 h-3.5" />}
                        {dish.status === 'Hidden' && <EyeOff className="w-3.5 h-3.5" />}
                        {dish.status}
                      </button>
                      
                      {/* Simple Hover Menu for Status Change */}
                      <div className="absolute top-full left-0 mt-2 w-36 bg-[#111] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-20 py-1">
                        <button onClick={() => changeStatus(dish.id, "Available")} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">Available</button>
                        <button onClick={() => changeStatus(dish.id, "Out of Stock")} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">Out of Stock</button>
                        <button onClick={() => changeStatus(dish.id, "Hidden")} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">Hidden</button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-300 text-sm">{dish.orders}</p>
                    <p className="text-gray-600 text-xs">Updated {dish.updated}</p>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-lg bg-[#111] hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#111] hover:bg-primary/20 border border-white/5 hover:border-primary/30 flex items-center justify-center text-gray-400 hover:text-primary transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#111] hover:bg-white/10 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-[#111] hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors" title="Delete">
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
          <div className="py-20 text-center text-gray-500">
            No dishes found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/5 bg-[#111] flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Showing {Math.min(filteredDishes.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredDishes.length, currentPage * itemsPerPage)} of {filteredDishes.length} dishes
        </p>
        
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-2 rounded-lg bg-[#171717] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg bg-[#171717] border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
