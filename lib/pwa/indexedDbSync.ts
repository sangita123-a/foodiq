/**
 * IndexedDB storage engine for client-side offline action queue.
 * Provides persistent offline action storage when network is offline.
 */

export interface OfflineAction {
  id?: string | number;
  sync_type: string;
  entity_type: string;
  entity_id?: string | null;
  payload: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retry_count: number;
  error_message?: string | null;
}

const DB_NAME = 'foodiq_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_sync_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('sync_type', 'sync_type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enqueue a new offline action to IndexedDB
 */
export async function enqueueOfflineAction(
  syncType: string,
  entityType: string,
  entityId: string | null,
  payload: Record<string, unknown>
): Promise<OfflineAction> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const actionItem: OfflineAction = {
      sync_type: syncType,
      entity_type: entityType || syncType,
      entity_id: entityId,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
    };

    const request = store.add(actionItem);

    request.onsuccess = () => {
      actionItem.id = request.result as number;
      resolve(actionItem);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending actions from IndexedDB sorted by timestamp (FIFO)
 */
export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const actions: OfflineAction[] = request.result || [];
      // Sort oldest first (FIFO)
      actions.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      resolve(actions);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update the status of an offline action in IndexedDB
 */
export async function updateOfflineActionStatus(
  id: string | number,
  status: 'pending' | 'syncing' | 'failed',
  retryCount?: number,
  errorMessage?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item: OfflineAction = getReq.result;
      if (item) {
        item.status = status;
        if (retryCount !== undefined) item.retry_count = retryCount;
        if (errorMessage !== undefined) item.error_message = errorMessage;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Delete a completed offline action from IndexedDB
 */
export async function removeOfflineAction(id: string | number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from IndexedDB store
 */
export async function clearOfflineActions(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
