'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useOfflineSync from '@/hooks/useOfflineSync';
import { deliverySyncApi, SyncLog } from '@/services/deliverySyncApi';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  MapPin,
  PackageCheck,
  Key,
  Wallet,
  AlertOctagon,
  Bell,
  User,
  Activity,
  Database,
  Sliders,
} from 'lucide-react';
import DeliveryShell from '@/components/delivery/DeliveryShell';
import { useDeliveryDashboard } from '@/hooks/useDeliveryData';
import { isClientAuthenticated } from '@/lib/authSession';

export default function DeliveryOfflinePage() {
  const router = useRouter();
  const { data: dashboard } = useDeliveryDashboard();
  const {

    isOnline,
    isSyncing,
    autoSyncEnabled,
    setAutoSyncEnabled,
    pendingQueue,
    serverStatus,
    lastSyncTime,
    syncProgress,
    bannerMessage,
    queueAction,
    triggerManualSync,
    retryFailed,
    refreshQueue,
  } = useOfflineSync();

  const [historyLogs, setHistoryLogs] = useState<SyncLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [simulatedActionType, setSimulatedActionType] = useState<string>('LOCATION_UPDATE');
  const [simulationNote, setSimulationNote] = useState<string>('');

  // Auth guard
  useEffect(() => {
    if (typeof window !== 'undefined' && !isClientAuthenticated()) {
      router.replace('/delivery/login');
    }
  }, [router]);

  // Fetch sync log history from backend
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await deliverySyncApi.getSyncHistory({ limit: 10 });
      if (res.success) {
        setHistoryLogs(res.data || []);
      }
    } catch {
      /* ignore if unauthenticated or server unreachable */
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      loadHistory();
    }
  }, [isOnline]);

  // Submit test offline action
  const handleSimulateAction = async () => {
    let payload: Record<string, unknown> = { simulated: true };
    let entityType = simulatedActionType;
    let entityId: string | null = null;

    switch (simulatedActionType) {
      case 'LOCATION_UPDATE':
        payload = { latitude: 12.9716 + Math.random() * 0.01, longitude: 77.5946 + Math.random() * 0.01, speed: 25 };
        break;
      case 'STATUS_CHANGE':
        payload = { order_id: `ord_${Date.now().toString().slice(-6)}`, status: 'Out_for_Delivery' };
        entityId = payload.order_id as string;
        break;
      case 'OTP_VERIFY':
        payload = { order_id: `ord_${Date.now().toString().slice(-6)}`, otp: '1234' };
        entityId = payload.order_id as string;
        break;
      case 'ORDER_ACCEPT':
        payload = { order_id: `ord_${Date.now().toString().slice(-6)}` };
        entityId = payload.order_id as string;
        break;
      case 'ORDER_COMPLETE':
        payload = { order_id: `ord_${Date.now().toString().slice(-6)}` };
        entityId = payload.order_id as string;
        break;
      case 'WALLET_UPDATE':
        payload = { amount: 150, transaction_type: 'credit', note: 'Delivery Tip' };
        break;
      case 'EMERGENCY_SOS':
        payload = { reason: 'Bike breakdown on highway', latitude: 12.9716, longitude: 77.5946 };
        break;
      case 'NOTIFICATION_READ':
        payload = { all: true };
        break;
      case 'PROFILE_CHANGE':
        payload = { city: 'Bengaluru', vehicle_type: 'Electric Scooter' };
        break;
    }

    await queueAction(simulatedActionType, entityType, entityId, payload);
    setSimulationNote(`Queued "${simulatedActionType}" action successfully!`);
    setTimeout(() => setSimulationNote(''), 4000);
  };

  const failedItems = pendingQueue.filter((i) => i.status === 'failed');

  return (
    <DeliveryShell title="Offline Sync" online={dashboard?.is_online}>
      <div className="-m-4 md:-m-8 bg-slate-950 text-slate-100 pb-16 min-h-[calc(100vh-5rem)]">
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
        {/* Top Header Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isOnline ? <Wifi className="w-8 h-8 animate-pulse" /> : <WifiOff className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Offline Mode & Auto Sync</h1>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  isSyncing
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                    : isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {isSyncing ? 'SYNCING IN PROGRESS' : isOnline ? 'ONLINE & READY' : 'OFFLINE MODE'}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Seamlessly store actions offline and auto-synchronize in FIFO order when internet returns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerManualSync}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition shadow-lg shadow-emerald-950/40"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            <button
              onClick={refreshQueue}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Refresh Local Queue"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Offline Alert Banner */}
        {(!isOnline || pendingQueue.length > 0 || bannerMessage) && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
            !isOnline
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
              : pendingQueue.length > 0
              ? 'bg-blue-950/40 border-blue-500/30 text-blue-200'
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {bannerMessage || (
                  !isOnline
                    ? 'Internet connection offline. Actions will be stored in IndexedDB queue.'
                    : `${pendingQueue.length} offline action(s) waiting to sync with backend.`
                )}
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-xs opacity-75 whitespace-nowrap flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Last Sync: {lastSyncTime}
              </span>
            )}
          </div>
        )}

        {/* Sync Progress Indicator */}
        {syncProgress && (
          <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-blue-400 flex items-center gap-2">
                <Activity className="w-4 h-4 animate-spin" /> Synchronizing Pending Items...
              </span>
              <span className="text-slate-400 font-mono">
                {syncProgress.current} / {syncProgress.total} ({Math.round((syncProgress.current / syncProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Control Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">IndexedDB Queue</p>
              <p className="text-2xl font-bold text-slate-100">{pendingQueue.length}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Server Pending</p>
              <p className="text-2xl font-bold text-slate-100">{serverStatus?.pending_count ?? 0}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Failed Retries</p>
              <p className="text-2xl font-bold text-slate-100">{failedItems.length + (serverStatus?.failed_count || 0)}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Auto Sync Engine</p>
              <p className="text-sm font-medium text-slate-200 mt-1">{autoSyncEnabled ? 'Enabled (ON)' : 'Disabled (OFF)'}</p>
            </div>
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`w-12 h-6 rounded-full p-1 transition ${autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSyncEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Offline Action Simulation Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
              <Sliders className="w-5 h-5" /> Test Offline Queue Simulator
            </div>
            {simulationNote && <span className="text-xs text-emerald-400 font-medium">{simulationNote}</span>}
          </div>

          <p className="text-slate-400 text-xs">
            Simulate performing offline driver actions. Actions are stored locally in IndexedDB when offline, then synced to backend PostgreSQL.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'LOCATION_UPDATE', label: 'Location Update', icon: MapPin },
              { id: 'STATUS_CHANGE', label: 'Status Change', icon: Activity },
              { id: 'OTP_VERIFY', label: 'OTP Verify', icon: Key },
              { id: 'ORDER_ACCEPT', label: 'Order Accept', icon: PackageCheck },
              { id: 'ORDER_COMPLETE', label: 'Order Complete', icon: CheckCircle2 },
              { id: 'WALLET_UPDATE', label: 'Wallet Credit', icon: Wallet },
              { id: 'EMERGENCY_SOS', label: 'Emergency SOS', icon: AlertOctagon },
              { id: 'NOTIFICATION_READ', label: 'Notification Read', icon: Bell },
              { id: 'PROFILE_CHANGE', label: 'Profile Change', icon: User },
            ].map((act) => {
              const Icon = act.icon;
              const isSelected = simulatedActionType === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setSimulatedActionType(act.id)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition text-xs font-medium ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{act.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSimulateAction}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium rounded-xl border border-emerald-500/30 transition text-sm"
            >
              <Play className="w-4 h-4 fill-emerald-400" /> Queue Action in IndexedDB
            </button>
          </div>
        </div>

        {/* Pending Client Queue Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" /> Local Pending Queue (IndexedDB)
            </h2>
            <span className="text-xs text-slate-400 font-mono">{pendingQueue.length} Items</span>
          </div>

          {pendingQueue.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No pending offline actions in client IndexedDB.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 px-2">ID</th>
                    <th className="pb-3 px-2">Action Type</th>
                    <th className="pb-3 px-2">Entity ID</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Timestamp</th>
                    <th className="pb-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {pendingQueue.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/30">
                      <td className="py-3 px-2 font-mono text-slate-500">#{item.id}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-semibold font-mono">
                          {item.sync_type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-300 font-mono">{item.entity_id || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          item.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                      <td className="py-3 px-2 text-right">
                        {item.status === 'failed' && (
                          <button
                            onClick={() => retryFailed()}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs transition"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Server Sync History Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" /> Backend Sync History Logs (PostgreSQL)
            </h2>
            <button
              onClick={loadHistory}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {historyLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No sync log history recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 px-2">Log UUID</th>
                    <th className="pb-3 px-2">Sync Type</th>
                    <th className="pb-3 px-2">Entity ID</th>
                    <th className="pb-3 px-2">Sync Status</th>
                    <th className="pb-3 px-2">Retries</th>
                    <th className="pb-3 px-2">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {historyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-2 font-mono text-slate-500">{log.id.slice(0, 8)}...</td>
                      <td className="py-3 px-2 font-mono font-semibold text-teal-300">{log.sync_type}</td>
                      <td className="py-3 px-2 font-mono text-slate-400">{log.entity_id || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          log.sync_status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : log.sync_status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {log.sync_status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{log.retry_count} / 5</td>
                      <td className="py-3 px-2 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </DeliveryShell>
  );
}
