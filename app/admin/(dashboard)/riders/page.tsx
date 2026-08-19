'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, MapPin, Bike, ShieldCheck, CheckCircle, XCircle, Power, PowerOff, Star, AlertTriangle } from 'lucide-react';

interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isOnline: boolean;
  rating: number;
  codBalance: number;
  status: 'Online' | 'On Delivery' | 'Offline';
  todayDeliveriesCount: number;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/riders');
      const data = await res.json();
      if (data.success) {
        setRiders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch riders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKycAction = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/admin/riders/${id}/kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: newStatus }),
      });
      if (res.ok) {
        setRiders(prev => prev.map(r => r.id === id ? { ...r, kycStatus: newStatus, isOnline: newStatus === 'APPROVED' ? r.isOnline : false } : r));
      }
    } catch (error) {
      console.error('Failed to update KYC status:', error);
    }
  };

  const toggleRiderStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/riders/${id}/kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !currentStatus }),
      });
      if (res.ok) {
        setRiders(prev => prev.map(r => {
          if (r.id === id) {
            const newIsOnline = !currentStatus;
            return {
              ...r,
              isOnline: newIsOnline,
              status: newIsOnline ? 'Online' : 'Offline' // Simplistic local update
            };
          }
          return r;
        }));
      }
    } catch (error) {
      console.error('Failed to toggle rider status:', error);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;
  }

  const pendingKycRiders = riders.filter(r => r.kycStatus === 'PENDING');
  const activeRiders = riders.filter(r => r.kycStatus === 'APPROVED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Online': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">Online</span>;
      case 'On Delivery': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">On Delivery</span>;
      case 'Offline': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Offline</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rider Fleet</h1>
        <p className="text-slate-500 mt-1">Manage delivery personnel and KYC verifications</p>
      </div>

      {/* KYC Verification Queue */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="text-indigo-500" /> KYC Verification Queue
          {pendingKycRiders.length > 0 && (
            <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">{pendingKycRiders.length} Pending</span>
          )}
        </h2>
        
        {pendingKycRiders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 border-dashed text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">All caught up!</h3>
            <p className="text-sm text-slate-500">No pending KYC verifications in the queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingKycRiders.map(rider => (
              <div key={rider.id} className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full -z-10"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{rider.name || 'Unnamed Rider'}</h3>
                    <p className="text-sm text-slate-500">{rider.phone || 'No phone provided'}</p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Bike size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-800">Vehicle:</span> {rider.vehicleNumber || 'Not provided'}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleKycAction(rider.id, 'APPROVED')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-1"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleKycAction(rider.id, 'REJECTED')}
                    className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 py-2 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-1"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Riders Table */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Bike className="text-blue-500" /> Active Riders Fleet
        </h2>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-4 font-semibold">Rider</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Today's Deliveries</th>
                  <th className="p-4 font-semibold">COD Balance</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRiders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No active riders found.
                    </td>
                  </tr>
                ) : (
                  activeRiders.map(rider => (
                    <tr key={rider.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            {rider.name ? rider.name.charAt(0).toUpperCase() : 'R'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{rider.name || 'Unnamed'}</div>
                            <div className="text-xs text-slate-500">{rider.phone} • {rider.vehicleNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(rider.status)}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">{rider.todayDeliveriesCount}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">₹{rider.codBalance || 0}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                          <Star size={16} className="text-amber-400 fill-amber-400" />
                          {rider.rating ? rider.rating.toFixed(1) : 'New'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => toggleRiderStatus(rider.id, rider.isOnline)}
                          className={`p-2 rounded-lg transition-colors inline-flex items-center gap-1 text-sm font-medium ${rider.isOnline ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={rider.isOnline ? 'Suspend Rider' : 'Activate Rider'}
                        >
                          {rider.isOnline ? (
                            <><PowerOff size={16} /> Suspend</>
                          ) : (
                            <><Power size={16} /> Activate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
