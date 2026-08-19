'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Store, Utensils, Edit, Trash2, Power, PowerOff, X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  imageUrl?: string;
  menuItems: MenuItem[];
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  
  // Selection state
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  
  // Form state
  const [restaurantForm, setRestaurantForm] = useState({
    name: '', address: '', latitude: '', longitude: '', imageUrl: '', ownerId: 'cm1234567890' // placeholder ownerId
  });
  
  const [menuForm, setMenuForm] = useState({
    name: '', price: '', category: '', isVeg: true, imageUrl: ''
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/restaurants');
      const data = await res.json();
      if (data.success) {
        setRestaurants(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRestaurantStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !currentStatus }),
      });
      if (res.ok) {
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isOpen: !currentStatus } : r));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantForm),
      });
      if (res.ok) {
        fetchRestaurants();
        setIsRestaurantModalOpen(false);
        setRestaurantForm({ name: '', address: '', latitude: '', longitude: '', imageUrl: '', ownerId: 'cm1234567890' });
      }
    } catch (error) {
      console.error('Failed to create restaurant:', error);
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant? This will also delete all its menu items.')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRestaurants(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete restaurant:', error);
    }
  };

  const openMenuManager = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsMenuModalOpen(true);
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...menuForm, price: parseFloat(menuForm.price), restaurantId: selectedRestaurant.id }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state
        const newItem = data.data;
        setRestaurants(prev => prev.map(r => {
          if (r.id === selectedRestaurant.id) {
            return { ...r, menuItems: [...r.menuItems, newItem] };
          }
          return r;
        }));
        setSelectedRestaurant(prev => prev ? { ...prev, menuItems: [...prev.menuItems, newItem] } : null);
        setMenuForm({ name: '', price: '', category: '', isVeg: true, imageUrl: '' });
      }
    } catch (error) {
      console.error('Failed to create menu item:', error);
    }
  };

  const toggleMenuItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, isAvailable: !currentStatus }),
      });
      if (res.ok) {
        const updateState = (items: MenuItem[]) => items.map(i => i.id === itemId ? { ...i, isAvailable: !currentStatus } : i);
        
        setRestaurants(prev => prev.map(r => {
          if (r.id === selectedRestaurant?.id) {
            return { ...r, menuItems: updateState(r.menuItems) };
          }
          return r;
        }));
        setSelectedRestaurant(prev => prev ? { ...prev, menuItems: updateState(prev.menuItems) } : null);
      }
    } catch (error) {
      console.error('Failed to toggle menu item status:', error);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm('Delete this dish?')) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const filterState = (items: MenuItem[]) => items.filter(i => i.id !== itemId);
        
        setRestaurants(prev => prev.map(r => {
          if (r.id === selectedRestaurant?.id) {
            return { ...r, menuItems: filterState(r.menuItems) };
          }
          return r;
        }));
        setSelectedRestaurant(prev => prev ? { ...prev, menuItems: filterState(prev.menuItems) } : null);
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Restaurants</h1>
          <p className="text-slate-500 mt-1">Manage partner restaurants and their menus</p>
        </div>
        <button
          onClick={() => setIsRestaurantModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow"
        >
          <Plus size={20} />
          Add Restaurant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 group">
            <div className="h-48 bg-slate-200 relative overflow-hidden">
              {restaurant.imageUrl ? (
                <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Store size={48} />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.isOpen)}
                  className={`p-2 rounded-full shadow-sm backdrop-blur-md ${restaurant.isOpen ? 'bg-green-500/90 text-white' : 'bg-rose-500/90 text-white'}`}
                  title={restaurant.isOpen ? 'Mark Closed' : 'Mark Open'}
                >
                  {restaurant.isOpen ? <Power size={16} /> : <PowerOff size={16} />}
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900">{restaurant.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                  {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-4 line-clamp-1">{restaurant.address}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-sm font-medium text-slate-600">
                  {restaurant.menuItems?.length || 0} items
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openMenuManager(restaurant)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    <Utensils size={18} /> Menu
                  </button>
                  <button
                    onClick={() => handleDeleteRestaurant(restaurant.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <Store className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No restaurants</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating a new restaurant.</p>
          </div>
        )}
      </div>

      {/* Add Restaurant Modal */}
      {isRestaurantModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Add New Restaurant</h2>
              <button onClick={() => setIsRestaurantModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRestaurant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={restaurantForm.name} onChange={e => setRestaurantForm({...restaurantForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={restaurantForm.address} onChange={e => setRestaurantForm({...restaurantForm, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input type="number" step="any" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={restaurantForm.latitude} onChange={e => setRestaurantForm({...restaurantForm, latitude: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input type="number" step="any" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={restaurantForm.longitude} onChange={e => setRestaurantForm({...restaurantForm, longitude: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input type="url" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={restaurantForm.imageUrl} onChange={e => setRestaurantForm({...restaurantForm, imageUrl: e.target.value})} />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                  Create Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Menu Modal */}
      {isMenuModalOpen && selectedRestaurant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Menu</h2>
                <p className="text-sm text-slate-500">{selectedRestaurant.name}</p>
              </div>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-slate-400 hover:text-slate-500 p-2 bg-white rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Add Menu Item Form */}
              <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-orange-500" /> Add New Dish
                </h3>
                <form onSubmit={handleCreateMenuItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                    <input required type="number" min="0" step="0.01" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input type="url" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" value={menuForm.imageUrl} onChange={e => setMenuForm({...menuForm, imageUrl: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isVeg" className="rounded text-orange-500 focus:ring-orange-500" checked={menuForm.isVeg} onChange={e => setMenuForm({...menuForm, isVeg: e.target.checked})} />
                    <label htmlFor="isVeg" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      <span className={`w-3 h-3 rounded-full border ${menuForm.isVeg ? 'bg-green-500 border-green-600' : 'bg-white border-green-500'}`}></span>
                      Vegetarian
                    </label>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl font-medium transition-colors mt-2">
                    Add Dish
                  </button>
                </form>
              </div>

              {/* Menu Items List */}
              <div className="p-6 md:w-2/3 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 mb-4">Current Menu ({selectedRestaurant.menuItems.length})</h3>
                <div className="space-y-3">
                  {selectedRestaurant.menuItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full border ${item.isVeg ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'}`} title={item.isVeg ? 'Veg' : 'Non-veg'}></span>
                            <h4 className="font-semibold text-slate-900">{item.name}</h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="font-medium text-slate-700">₹{item.price}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{item.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer">
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={item.isAvailable} onChange={() => toggleMenuItemStatus(item.id, item.isAvailable)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${item.isAvailable ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                          <span className="ml-2 text-xs font-medium text-slate-600 w-12">{item.isAvailable ? 'In Stock' : 'Out'}</span>
                        </label>
                        
                        <button onClick={() => handleDeleteMenuItem(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedRestaurant.menuItems.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Utensils className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p>No items on the menu yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
