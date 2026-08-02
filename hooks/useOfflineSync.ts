'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  enqueueOfflineAction,
  getPendingOfflineActions,
  removeOfflineAction,
  clearOfflineActions,
  OfflineAction,
} from '@/lib/pwa/indexedDbSync';
import { deliverySyncApi, SyncStatusResponse } from '@/services/deliverySyncApi';
import { SOCKET_EVENTS } from '@/lib/socketEvents';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [pendingQueue, setPendingQueue] = useState<OfflineAction[]>([]);
  const [serverStatus, setServerStatus] = useState<SyncStatusResponse | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    syncedCount: number;
    failedCount: number;
  } | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Refresh pending queue from IndexedDB
  const refreshQueue = useCallback(async () => {
    try {
      const items = await getPendingOfflineActions();
      setPendingQueue(items);
    } catch {
      /* ignore if indexedDb unavailable */
    }
  }, []);

  // Fetch status from backend server
  const fetchServerStatus = useCallback(async () => {
    try {
      const res = await deliverySyncApi.getSyncStatus();
      setServerStatus(res);
      if (res.last_sync_at) {
        setLastSyncTime(new Date(res.last_sync_at).toLocaleString());
      }
    } catch {
      /* offline or unauthenticated */
    }
  }, []);

  // Execute synchronization with backend
  const triggerManualSync = useCallback(async () => {
    if (!isOnline) {
      setBannerMessage('Cannot sync while offline. Waiting for network connection...');
      return;
    }

    setIsSyncing(true);
    setBannerMessage('Synchronization started...');

    try {
      const localActions = await getPendingOfflineActions();
      const response = await deliverySyncApi.manualSync(localActions);

      if (response.success) {
        await clearOfflineActions();
        await refreshQueue();
        await fetchServerStatus();
        const now = new Date().toLocaleString();
        setLastSyncTime(now);
        setBannerMessage(`Sync completed successfully at ${now}`);
      } else {
        setBannerMessage('Sync completed with errors.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Synchronization failed';
      setBannerMessage(`Sync error: ${msg}`);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [isOnline, refreshQueue, fetchServerStatus]);

  // Queue a new offline action into IndexedDB
  const queueAction = useCallback(
    async (
      syncType: string,
      entityType: string,
      entityId: string | null,
      payload: Record<string, unknown>
    ) => {
      const item = await enqueueOfflineAction(syncType, entityType, entityId, payload);
      await refreshQueue();

      if (!isOnline) {
        setBannerMessage(`Action "${syncType}" saved to offline queue`);
      } else if (autoSyncEnabled) {
        // Auto sync immediately if online
        triggerManualSync();
      }
      return item;
    },
    [isOnline, autoSyncEnabled, refreshQueue, triggerManualSync]
  );

  // Retry failed sync request
  const retryFailed = useCallback(
    async (syncLogId?: string) => {
      setIsSyncing(true);
      try {
        await deliverySyncApi.retrySync(syncLogId);
        await triggerManualSync();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Retry failed';
        setBannerMessage(`Retry error: ${msg}`);
      } finally {
        setIsSyncing(false);
      }
    },
    [triggerManualSync]
  );

  // Listen to network status (online/offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setBannerMessage('Internet connection restored. Auto Syncing...');
      if (autoSyncEnabled) {
        triggerManualSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setBannerMessage('Offline Mode Enabled. Actions will be queued.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshQueue();
    fetchServerStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSyncEnabled, refreshQueue, fetchServerStatus, triggerManualSync]);

  // Service worker background sync listener
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'TRIGGER_AUTO_SYNC' && autoSyncEnabled) {
          triggerManualSync();
        }
      };
      navigator.serviceWorker.addEventListener('message', messageHandler);
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
  }, [autoSyncEnabled, triggerManualSync]);

  return {
    isOnline,
    isSyncing,
    autoSyncEnabled,
    setAutoSyncEnabled,
    pendingQueue,
    serverStatus,
    lastSyncTime,
    syncProgress,
    bannerMessage,
    setBannerMessage,
    queueAction,
    triggerManualSync,
    retryFailed,
    refreshQueue,
  };
}

export default useOfflineSync;
