const syncModel = require('../models/deliverySyncModel');
const syncService = require('../services/deliverySyncService');

/**
 * GET /api/delivery/sync/status
 * Get current sync status, pending count, and last sync timestamp for partner
 */
const getSyncStatus = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized partner' });
    }

    const { logs, total } = await syncModel.getSyncLogsByPartner(partnerId, { limit: 1 });
    const pendingLogs = await syncModel.getPendingLogs(partnerId);

    const pendingCount = pendingLogs.filter((l) => l.sync_status === 'pending').length;
    const failedCount = pendingLogs.filter((l) => l.sync_status === 'failed').length;
    const lastSyncAt = logs.length > 0 ? logs[0].updated_at : null;

    return res.json({
      success: true,
      partner_id: partnerId,
      status: pendingCount > 0 ? 'pending_items' : 'synced',
      pending_count: pendingCount,
      failed_count: failedCount,
      total_history: total,
      last_sync_at: lastSyncAt,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/delivery/sync/history
 * Get paginated sync log history for partner
 */
const getSyncHistory = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized partner' });
    }

    const { status, limit = '20', page = '1' } = req.query;
    const limitNum = parseInt(limit, 10) || 20;
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    const result = await syncModel.getSyncLogsByPartner(partnerId, {
      status,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(result.total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/delivery/sync/manual
 * Manually trigger sync or submit client-queued offline actions array
 */
const processManualSync = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized partner' });
    }

    const { actions = [] } = req.body;
    const syncResult = await syncService.processBatchSync(partnerId, actions);

    return res.json({
      success: true,
      message: 'Synchronization process finished',
      result: syncResult,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/delivery/sync/retry
 * Retry failed sync requests for partner
 */
const retryFailedSync = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized partner' });
    }

    const { sync_log_id } = req.body;
    const result = await syncService.retryFailedSyncs(partnerId, sync_log_id);

    return res.json({
      success: true,
      message: 'Retry synchronization completed',
      result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/sync/queue
 * Admin view of sync logs
 */
const getAdminSyncList = async (req, res) => {
  try {
    const { status, partner_id, sync_type, search, limit = '50', page = '1' } = req.query;
    const limitNum = parseInt(limit, 10) || 50;
    const pageNum = parseInt(page, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    const result = await syncModel.getAdminSyncLogs({
      status,
      partnerId: partner_id,
      syncType: sync_type,
      search,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(result.total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin/sync/stats
 * Admin view of sync engine statistics
 */
const getAdminSyncStats = async (req, res) => {
  try {
    const stats = await syncModel.getAdminSyncStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin/sync/retry
 * Admin action to retry a specific sync item
 */
const retryAdminSync = async (req, res) => {
  try {
    const { sync_log_id } = req.body;
    if (!sync_log_id) {
      return res.status(400).json({ success: false, message: 'sync_log_id is required' });
    }

    const log = await syncModel.getSyncLogById(sync_log_id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Sync log not found' });
    }

    const result = await syncService.retryFailedSyncs(log.partner_id, sync_log_id);
    return res.json({
      success: true,
      message: 'Sync item retried successfully',
      result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSyncStatus,
  getSyncHistory,
  processManualSync,
  retryFailedSync,
  getAdminSyncList,
  getAdminSyncStats,
  retryAdminSync,
};
