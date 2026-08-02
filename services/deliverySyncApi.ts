import api from '@/services/api';
import { OfflineAction } from '@/lib/pwa/indexedDbSync';

export type SyncLog = {
  id: string;
  partner_id: string;
  sync_type: string;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  retry_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  partner_name?: string;
  partner_phone?: string;
};

export type SyncStatusResponse = {
  success: boolean;
  partner_id: string;
  status: string;
  pending_count: number;
  failed_count: number;
  total_history: number;
  last_sync_at: string | null;
};

export type SyncHistoryResponse = {
  success: boolean;
  data: SyncLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type AdminSyncStatsResponse = {
  success: boolean;
  stats: {
    summary: {
      total_count: number;
      pending_count: number;
      syncing_count: number;
      completed_count: number;
      failed_count: number;
      completed_today: number;
    };
    partnerStats: Array<{
      partner_id: string;
      full_name: string;
      pending_actions: number;
      failed_actions: number;
      last_sync_at: string;
    }>;
  };
};

export const deliverySyncApi = {
  // Delivery Partner Endpoints
  getSyncStatus: async (): Promise<SyncStatusResponse> => {
    const response = await api.get('/api/delivery/sync/status');
    return response.data;
  },

  getSyncHistory: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<SyncHistoryResponse> => {
    const response = await api.get('/api/delivery/sync/history', { params });
    return response.data;
  },

  manualSync: async (actions?: OfflineAction[]) => {
    const response = await api.post('/api/delivery/sync/manual', { actions });
    return response.data;
  },

  retrySync: async (syncLogId?: string) => {
    const response = await api.post('/api/delivery/sync/retry', {
      sync_log_id: syncLogId,
    });
    return response.data;
  },

  // Admin Portal Endpoints
  getAdminSyncQueue: async (params?: {
    status?: string;
    partner_id?: string;
    sync_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SyncHistoryResponse> => {
    const response = await api.get('/api/admin/sync/queue', { params });
    return response.data;
  },

  getAdminSyncStats: async (): Promise<AdminSyncStatsResponse> => {
    const response = await api.get('/api/admin/sync/stats');
    return response.data;
  },

  retryAdminSync: async (syncLogId: string) => {
    const response = await api.post('/api/admin/sync/retry', {
      sync_log_id: syncLogId,
    });
    return response.data;
  },
};

export default deliverySyncApi;
