'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { deliverySyncApi, SyncLog, AdminSyncStatsResponse } from '@/services/deliverySyncApi';
import {
  RefreshCw,
  Search,
  Filter,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Zap,
  Users,
  Database,
  BarChart3,
  Layers,
} from 'lucide-react';

export default function AdminSyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<AdminSyncStatsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [syncTypeFilter, setSyncTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'failed' | 'partners'>('queue');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchLogsAndStats = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        deliverySyncApi.getAdminSyncQueue({
          status: activeTab === 'failed' ? 'failed' : statusFilter,
          sync_type: syncTypeFilter,
          search: searchTerm,
          page,
          limit: 20,
        }),
        deliverySyncApi.getAdminSyncStats(),
      ]);

      if (logsRes.success) {
        setLogs(logsRes.data || []);
        setTotalPages(logsRes.pagination?.pages || 1);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch {
      /* ignore if unauthenticated */
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, syncTypeFilter, searchTerm, page]);

  useEffect(() => {
    fetchLogsAndStats();
  }, [fetchLogsAndStats]);

  const handleAdminRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await deliverySyncApi.retryAdminSync(logId);
      await fetchLogsAndStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      alert(`Admin retry error: ${msg}`);
    } finally {
      setRetryingId(null);
    }
  };

  const summary = stats?.summary || {
    total_count: 0,
    pending_count: 0,
    syncing_count: 0,
    completed_count: 0,
    failed_count: 0,
    completed_today: 0,
  };

  const totalCount = Number(summary.total_count) || 0;
  const completedCount = Number(summary.completed_count) || 0;
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sync Engine Control & Monitoring</h1>
              <p className="text-slate-400 text-sm mt-1">
                Real-time delivery partner offline action queues, retry logs, and conflict resolution analytics.
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogsAndStats}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 font-medium rounded-xl transition text-sm shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Dashboard
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Sync Actions</p>
              <p className="text-2xl font-bold text-slate-100">{summary.total_count}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Pending Queue</p>
              <p className="text-2xl font-bold text-slate-100">{summary.pending_count}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Completed Today</p>
              <p className="text-2xl font-bold text-slate-100">{summary.completed_today}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Failed Retries</p>
              <p className="text-2xl font-bold text-slate-100">{summary.failed_count}</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Success Rate</p>
              <p className="text-2xl font-bold text-slate-100">{successRate}%</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-4 text-sm font-medium">
          <button
            onClick={() => { setActiveTab('queue'); setPage(1); }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'queue' ? 'border-teal-400 text-teal-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> All Sync Queue
          </button>
          <button
            onClick={() => { setActiveTab('failed'); setPage(1); }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'failed' ? 'border-red-400 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Failed Syncs ({summary.failed_count})
          </button>
          <button
            onClick={() => { setActiveTab('partners'); setPage(1); }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'partners' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Partner Status List
          </button>
        </div>

        {/* Filter Bar */}
        {activeTab !== 'partners' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search partner name, phone or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Filter className="w-4 h-4" /> Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="syncing">Syncing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={syncTypeFilter}
                onChange={(e) => setSyncTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="">All Action Types</option>
                <option value="LOCATION_UPDATE">LOCATION_UPDATE</option>
                <option value="STATUS_CHANGE">STATUS_CHANGE</option>
                <option value="OTP_VERIFY">OTP_VERIFY</option>
                <option value="ORDER_ACCEPT">ORDER_ACCEPT</option>
                <option value="ORDER_COMPLETE">ORDER_COMPLETE</option>
                <option value="WALLET_UPDATE">WALLET_UPDATE</option>
                <option value="EMERGENCY_SOS">EMERGENCY_SOS</option>
                <option value="NOTIFICATION_READ">NOTIFICATION_READ</option>
                <option value="PROFILE_CHANGE">PROFILE_CHANGE</option>
              </select>
            </div>
          </div>
        )}

        {/* Content Section */}
        {activeTab === 'partners' ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Active Partner Sync Status
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 px-2">Partner ID</th>
                    <th className="pb-3 px-2">Full Name</th>
                    <th className="pb-3 px-2">Pending Actions</th>
                    <th className="pb-3 px-2">Failed Actions</th>
                    <th className="pb-3 px-2">Last Sync Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(stats?.partnerStats || []).map((p) => (
                    <tr key={p.partner_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-2 font-mono text-slate-500">{p.partner_id.slice(0, 8)}...</td>
                      <td className="py-3 px-2 font-medium text-slate-200">{p.full_name || 'Delivery Partner'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          Number(p.pending_actions) > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.pending_actions}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          Number(p.failed_actions) > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.failed_actions}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{new Date(p.last_sync_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400" />
                {activeTab === 'failed' ? 'Failed Action Retries' : 'Global Sync Queue Logs'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">Page {page} of {totalPages}</span>
            </div>

            {logs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No sync logs match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 px-2">ID</th>
                      <th className="pb-3 px-2">Partner</th>
                      <th className="pb-3 px-2">Sync Type</th>
                      <th className="pb-3 px-2">Entity ID</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Retries</th>
                      <th className="pb-3 px-2">Error / Info</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-2 font-mono text-slate-500">{log.id.slice(0, 8)}...</td>
                        <td className="py-3 px-2">
                          <div className="font-medium text-slate-200">{log.partner_name || 'Partner'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.partner_phone || log.partner_id.slice(0, 8)}</div>
                        </td>
                        <td className="py-3 px-2 font-mono font-semibold text-teal-300">{log.sync_type}</td>
                        <td className="py-3 px-2 font-mono text-slate-400">{log.entity_id ? `${log.entity_id.slice(0, 8)}...` : '-'}</td>
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
                        <td className="py-3 px-2 text-slate-400 font-mono">{log.retry_count} / 5</td>
                        <td className="py-3 px-2 text-slate-400 max-w-xs truncate">
                          {log.error_message ? (
                            <span className="text-red-400">{log.error_message}</span>
                          ) : (
                            <span className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {log.sync_status === 'failed' && (
                            <button
                              onClick={() => handleAdminRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-xs transition flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                              <span>Retry</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg"
              >
                Previous
              </button>
              <span className="text-slate-400">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
