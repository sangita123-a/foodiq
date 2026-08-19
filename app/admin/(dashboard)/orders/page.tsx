"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, Bike, MapPin, Phone, User, X, ChevronDown, Clock, Eye } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Rider {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  vehicleNumber?: string;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  razorpayPaymentId: string | null;
  user: { name: string; email: string; phone: string };
  restaurant: { name: string; address: string };
  rider: Rider | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderItems: Array<{ 
    quantity: number; 
    menuItem: { name: string; isVeg: boolean; price: number } 
  }>;
}

const TABS = ["All", "PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders);
        setRiders(json.data.riders);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success(`Order status updated to ${newStatus}`, { id: loadingToast });
      } else {
        toast.error(json.error || "Failed to update status", { id: loadingToast });
      }
      setActiveDropdown(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status", { id: loadingToast });
    }
  };

  const handleAssignRider = async (riderId: string | null) => {
    if (!selectedOrder) return;
    const loadingToast = toast.loading("Assigning rider...");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id, riderId }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData(); // Refetch to get populated rider data
        toast.success(riderId ? "Rider assigned successfully" : "Rider unassigned", { id: loadingToast });
      } else {
        toast.error(json.error || "Failed to assign rider", { id: loadingToast });
      }
      setIsRiderModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to assign rider:", error);
      toast.error("Failed to assign rider", { id: loadingToast });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full">Delivered</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded-full">Cancelled</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full">Pending</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded-full">Out for Delivery</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-purple-500/10 text-purple-500 rounded-full">{status}</span>;
    }
  };

  const filteredOrders = activeTab === "All" ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div className="space-y-6 pb-12 relative min-h-screen">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Orders</h1>
          <p className="text-gray-400">Manage and track customer orders in real-time.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 border-b border-gray-800 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab 
                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            {tab.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No orders found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-800/50 text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Restaurant</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Rider</th>
                  <th className="px-6 py-4 font-medium">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-800/40 transition-colors group">
                    {/* Order Details */}
                    <td className="px-6 py-4 align-middle">
                      <div className="font-medium text-white flex items-center gap-2">
                        #{order.id.slice(-6).toUpperCase()}
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                          className="text-gray-500 hover:text-orange-500 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    
                    {/* Customer */}
                    <td className="px-6 py-4 align-middle">
                      <div className="font-medium text-gray-200">{order.user.name || "Guest"}</div>
                      <div className="text-xs text-gray-500">{order.user.phone || "No phone"}</div>
                    </td>
                    
                    {/* Restaurant */}
                    <td className="px-6 py-4 align-middle">
                      <div className="font-medium text-gray-300">{order.restaurant.name}</div>
                    </td>

                    {/* Amount & Payment */}
                    <td className="px-6 py-4 align-middle">
                      <div className="font-medium text-white">₹{Number(order.totalAmount).toLocaleString()}</div>
                      <div className={`text-xs mt-1 font-medium ${order.razorpayPaymentId ? 'text-green-500' : 'text-gray-500'}`}>
                        {order.razorpayPaymentId ? 'Paid' : 'COD'}
                      </div>
                    </td>

                    {/* Rider Assignment */}
                    <td className="px-6 py-4 align-middle">
                      {order.rider ? (
                        <div>
                          <div className="font-medium text-gray-200 flex items-center gap-1">
                            <Bike className="h-3 w-3 text-blue-500" /> {order.rider.name}
                          </div>
                          <button 
                            onClick={() => { setSelectedOrder(order); setIsRiderModalOpen(true); }}
                            className="text-xs text-orange-500 hover:text-orange-400 font-medium mt-1"
                          >
                            Re-assign
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsRiderModalOpen(true); }}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
                        >
                          Assign Rider
                        </button>
                      )}
                    </td>

                    {/* Status & Action */}
                    <td className="px-6 py-4 align-middle relative">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                        
                        {/* Status Dropdown */}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === order.id ? null : order.id);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>

                          {activeDropdown === order.id && (
                            <div className="absolute top-full right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                              {["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(order.id, s)}
                                  className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-700 transition-colors ${
                                    order.status === s ? 'text-orange-500 font-medium bg-gray-700/50' : 'text-gray-300'
                                  }`}
                                >
                                  {s.replace(/_/g, " ")}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-800/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Order #{selectedOrder.id.slice(-6).toUpperCase()}
                {getStatusBadge(selectedOrder.status)}
              </h3>
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Customer Details</h4>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800/50">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-4 w-4 text-orange-500" />
                      <span className="text-white font-medium">{selectedOrder.user.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-300">{selectedOrder.user.phone}</span>
                    </div>
                    {selectedOrder.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-1" />
                        <span className="text-gray-300 text-sm">
                          {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.zipCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Restaurant Details</h4>
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-800/50">
                    <div className="text-white font-medium mb-1">{selectedOrder.restaurant.name}</div>
                    <div className="text-gray-400 text-sm">{selectedOrder.restaurant.address}</div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Order Items</h4>
                <div className="bg-gray-800/50 rounded-lg border border-gray-800/50 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium text-center">Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Price</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {selectedOrder.orderItems.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 text-gray-200">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${item.menuItem.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {item.menuItem.name}
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-gray-300 text-right">₹{Number(item.menuItem.price).toLocaleString()}</td>
                          <td className="px-4 py-3 text-white font-medium text-right">₹{(Number(item.menuItem.price) * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-gray-800 p-4 flex justify-between items-center border-t border-gray-700">
                    <span className="text-gray-400 font-medium">Total Amount</span>
                    <span className="text-xl font-bold text-orange-500">₹{Number(selectedOrder.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Rider Modal */}
      {isRiderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bike className="h-5 w-5 text-orange-500" />
                Assign Rider for #{selectedOrder.id.slice(-6).toUpperCase()}
              </h3>
              <button 
                onClick={() => { setIsRiderModalOpen(false); setSelectedOrder(null); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {riders.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No riders available in the system.
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleAssignRider(null)}
                    className="w-full flex flex-col p-3 rounded-lg border border-gray-800 bg-gray-800/30 hover:border-gray-600 transition-colors text-left group"
                  >
                    <span className="font-medium text-gray-300 group-hover:text-white">Unassign Rider</span>
                    <span className="text-xs text-gray-500">Remove current assignment</span>
                  </button>

                  <div className="my-2 border-t border-gray-800"></div>

                  {riders.map(rider => (
                    <button
                      key={rider.id}
                      onClick={() => handleAssignRider(rider.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-800 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-800 p-2 rounded-full group-hover:bg-orange-500/10">
                          <User className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-200 group-hover:text-white transition-colors">{rider.name}</div>
                          <div className="text-xs text-gray-500">{rider.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rider.isOnline && (
                          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        )}
                        <span className="text-xs font-medium text-gray-400 group-hover:text-orange-500 transition-colors">
                          Assign
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Global Click Handler to close dropdown */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
}
