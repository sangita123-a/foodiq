'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { deliverySyncApi, SyncLog, AdminSyncStatsResponse } from '@/services/deliverySyncApi';
import {
  RefreshCw,
  Search,
  Filter,
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
import AdminShell from '@/components/admin/AdminShell';
import StatCard from '@/components/admin/dashboard/StatCard';
import { Badge, EmptyState } from '@/components/admin/ui';

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

  const TABS: Array<{ key: typeof activeTab; label: string; icon: typeof Layers; accent: string }> = [
    { key: 'queue', label: 'All Sync Queue', icon: Layers, accent: 'text-primary border-primary' },
    { key: 'failed', label: `Failed Syncs (${summary.failed_count})`, icon: AlertTriangle, accent: 'text-red-600 border-red-500' },
    { key: 'partners', label: 'Partner Status List', icon: Users, accent: 'text-blue-600 border-blue-500' },
  ];

  return (
    <AdminShell title="Sync Engine">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-[var(--shadow-admin-soft)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 text-primary rounded-xl shrink-0">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Sync Engine Control &amp; Monitoring</h1>
              <p className="text-gray-text text-sm mt-1">
                Real-time delivery partner offline action queues, retry logs, and conflict resolution analytics.
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogsAndStats}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-section hover:bg-[var(--surface-hover)] text-foreground border border-border font-bold rounded-xl transition text-sm shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Dashboard
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Sync Actions" value={Number(summary.total_count) || 0} icon={Database} color="text-blue-600" bg="bg-blue-500/10" />
          <StatCard label="Pending Queue" value={Number(summary.pending_count) || 0} icon={Clock} color="text-amber-600" bg="bg-amber-500/10" />
          <StatCard label="Completed Today" value={Number(summary.completed_today) || 0} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-500/10" />
          <StatCard label="Failed Retries" value={Number(summary.failed_count) || 0} icon={AlertTriangle} color="text-red-600" bg="bg-red-500/10" />
          <StatCard label="Success Rate" value={successRate} icon={BarChart3} color="text-primary" bg="bg-primary/10" format={(n) => `${n}%`} />
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border gap-4 text-sm font-bold overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key ? tab.accent : 'border-transparent text-gray-text hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        {activeTab !== 'partners' && (
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search partner name, phone or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-section border border-transparent text-foreground text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-gray-text font-bold shrink-0">
                <Filter className="w-4 h-4" /> Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-section border border-transparent text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
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
                className="bg-section border border-transparent text-foreground text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
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
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-6 space-y-4">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Active Partner Sync Status
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[#9CA3AF]">
                    <th className="pb-3 px-2 font-bold uppercase">Partner ID</th>
                    <th className="pb-3 px-2 font-bold uppercase">Full Name</th>
                    <th className="pb-3 px-2 font-bold uppercase">Pending Actions</th>
                    <th className="pb-3 px-2 font-bold uppercase">Failed Actions</th>
                    <th className="pb-3 px-2 font-bold uppercase">Last Sync Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(stats?.partnerStats || []).map((p) => (
                    <tr key={p.partner_id} className="hover:bg-section/50 transition-colors">
                      <td className="py-3 px-2 font-mono text-gray-text">{p.partner_id.slice(0, 8)}...</td>
                      <td className="py-3 px-2 font-bold text-foreground">{p.full_name || 'Delivery Partner'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          Number(p.pending_actions) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-section text-gray-text'
                        }`}>
                          {p.pending_actions}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          Number(p.failed_actions) > 0 ? 'bg-red-50 text-red-700' : 'bg-section text-gray-text'
                        }`}>
                          {p.failed_actions}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-text">{new Date(p.last_sync_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(stats?.partnerStats || []).length === 0 && (
                <EmptyState icon={Users} title="No partner sync data" description="No delivery partners have synced yet." />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                {activeTab === 'failed' ? 'Failed Action Retries' : 'Global Sync Queue Logs'}
              </h2>
              <span className="text-xs text-gray-text font-mono">Page {page} of {totalPages}</span>
            </div>

            {logs.length === 0 ? (
              <EmptyState icon={Database} title="No sync logs" description="No sync logs match the selected filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[#9CA3AF]">
                      <th className="pb-3 px-2 font-bold uppercase">ID</th>
                      <th className="pb-3 px-2 font-bold uppercase">Partner</th>
                      <th className="pb-3 px-2 font-bold uppercase">Sync Type</th>
                      <th className="pb-3 px-2 font-bold uppercase">Entity ID</th>
                      <th className="pb-3 px-2 font-bold uppercase">Status</th>
                      <th className="pb-3 px-2 font-bold uppercase">Retries</th>
                      <th className="pb-3 px-2 font-bold uppercase">Error / Info</th>
                      <th className="pb-3 px-2 font-bold uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-section/50 transition-colors">
                        <td className="py-3 px-2 font-mono text-gray-text">{log.id.slice(0, 8)}...</td>
                        <td className="py-3 px-2">
                          <div className="font-bold text-foreground">{log.partner_name || 'Partner'}</div>
                          <div className="text-[10px] text-gray-text font-mono">{log.partner_phone || log.partner_id.slice(0, 8)}</div>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-primary">{log.sync_type}</td>
                        <td className="py-3 px-2 font-mono text-gray-text">{log.entity_id ? `${log.entity_id.slice(0, 8)}...` : '-'}</td>
                        <td className="py-3 px-2">
                          <Badge tone={log.sync_status === 'completed' ? 'success' : log.sync_status === 'failed' ? 'error' : 'warning'}>
                            {log.sync_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-gray-text font-mono">{log.retry_count} / 5</td>
                        <td className="py-3 px-2 text-gray-text max-w-xs truncate">
                          {log.error_message ? (
                            <span className="text-red-600">{log.error_message}</span>
                          ) : (
                            <span className="text-gray-text">{new Date(log.created_at).toLocaleTimeString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {log.sync_status === 'failed' && (
                            <button
                              onClick={() => handleAdminRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto disabled:opacity-50"
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
            <div className="flex justify-between items-center pt-4 border-t border-border text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-section hover:bg-[var(--surface-hover)] disabled:opacity-40 text-foreground font-bold rounded-lg"
              >
                Previous
              </button>
              <span className="text-gray-text">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-section hover:bg-[var(--surface-hover)] disabled:opacity-40 text-foreground font-bold rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
