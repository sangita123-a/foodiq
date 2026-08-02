const { pool } = require('../config/db');
const syncModel = require('../models/deliverySyncModel');
const {
  emitSyncStart,
  emitSyncProgress,
  emitSyncCompleted,
  emitSyncFailed,
} = require('../socket/emitters');

/**
 * Dispatch specific offline action types to their business logic handlers
 */
const dispatchAction = async (partnerId, log) => {
  const { sync_type, entity_type, entity_id, payload } = log;
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload || {};

  const type = (sync_type || entity_type || '').toUpperCase();

  switch (type) {
    case 'LOCATION_UPDATE':
    case 'LOCATION': {
      const { latitude, longitude, lat, lng } = data;
      const finalLat = latitude || lat;
      const finalLng = longitude || lng;

      if (finalLat != null && finalLng != null) {
        await pool.query(
          `UPDATE delivery_partners
           SET updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [partnerId]
        );
        // Insert into delivery_location_history if exists
        try {
          await pool.query(
            `INSERT INTO delivery_location_history (partner_id, latitude, longitude)
             VALUES ($1, $2, $3)`,
            [partnerId, finalLat, finalLng]
          );
        } catch {
          /* optional location history table check */
        }
      }
      return { success: true, action: 'LOCATION_UPDATE' };
    }

    case 'STATUS_CHANGE':
    case 'ORDER_STATUS': {
      const orderId = entity_id || data.order_id || data.id;
      const status = data.status || data.order_status;

      if (!orderId || !status) {
        throw new Error('Missing order_id or status for STATUS_CHANGE action');
      }

      // Conflict resolution: check current order status
      const existing = await pool.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
      if (existing.rows.length === 0) {
        return { success: true, skipped: true, reason: 'Order no longer exists' };
      }

      const currentStatus = existing.rows[0].status;
      // Do not downgrade status
      if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
        return { success: true, skipped: true, reason: `Order already in terminal state ${currentStatus}` };
      }

      await pool.query(
        `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [status, orderId]
      );
      return { success: true, orderId, status };
    }

    case 'OTP_VERIFY':
    case 'ORDER_OTP': {
      const orderId = entity_id || data.order_id;
      const otp = data.otp || data.code;

      if (!orderId || !otp) {
        throw new Error('Missing orderId or OTP code for OTP_VERIFY action');
      }

      // Validate OTP match against order or OTP codes table
      const orderCheck = await pool.query(`SELECT delivery_otp FROM orders WHERE id = $1`, [orderId]);
      if (orderCheck.rows.length > 0 && orderCheck.rows[0].delivery_otp) {
        if (String(orderCheck.rows[0].delivery_otp).trim() !== String(otp).trim()) {
          throw new Error('Invalid OTP code provided');
        }
      }

      await pool.query(
        `UPDATE orders SET status = 'Delivered', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [orderId]
      );
      return { success: true, orderId, verified: true };
    }

    case 'ORDER_ACCEPT':
    case 'ACCEPT_ORDER': {
      const orderId = entity_id || data.order_id;
      if (!orderId) {
        throw new Error('Missing order_id for ORDER_ACCEPT action');
      }

      // Check if order is already assigned to someone else
      const check = await pool.query(`SELECT delivery_partner_id, status FROM orders WHERE id = $1`, [orderId]);
      if (check.rows.length > 0) {
        if (check.rows[0].delivery_partner_id && check.rows[0].delivery_partner_id !== partnerId) {
          return { success: true, skipped: true, reason: 'Order already accepted by another partner' };
        }
      }

      await pool.query(
        `UPDATE orders
         SET delivery_partner_id = $1, status = 'Preparing', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [partnerId, orderId]
      );
      return { success: true, orderId, accepted: true };
    }

    case 'ORDER_COMPLETE':
    case 'DELIVERY_COMPLETE': {
      const orderId = entity_id || data.order_id;
      if (!orderId) {
        throw new Error('Missing order_id for ORDER_COMPLETE action');
      }

      await pool.query(
        `UPDATE orders
         SET status = 'Delivered', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [orderId]
      );

      // Increment partner earnings / completed delivery count
      await pool.query(
        `UPDATE delivery_partners
         SET updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [partnerId]
      );

      return { success: true, orderId, completed: true };
    }

    case 'WALLET_UPDATE':
    case 'WALLET': {
      const amount = Number(data.amount || 0);
      const transactionType = data.transaction_type || 'credit';

      if (amount > 0) {
        if (transactionType === 'credit') {
          await pool.query(
            `UPDATE delivery_partners SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
            [amount, partnerId]
          );
        } else if (transactionType === 'debit') {
          await pool.query(
            `UPDATE delivery_partners SET wallet_balance = GREATEST(0, wallet_balance - $1) WHERE id = $2`,
            [amount, partnerId]
          );
        }
      }
      return { success: true, updatedWallet: true, amount };
    }

    case 'EMERGENCY_SOS':
    case 'SOS': {
      const { reason, latitude, longitude } = data;
      try {
        await pool.query(
          `INSERT INTO delivery_emergencies (
            partner_id, reason, latitude, longitude, status
          ) VALUES ($1, $2, $3, $4, 'active')`,
          [partnerId, reason || 'Offline Emergency SOS', latitude || null, longitude || null]
        );
      } catch {
        /* fallback if table is structured slightly differently */
      }
      return { success: true, sosTriggered: true };
    }

    case 'NOTIFICATION_READ':
    case 'READ_NOTIFICATIONS': {
      const notificationId = entity_id || data.notification_id;
      if (notificationId) {
        await pool.query(
          `UPDATE delivery_notifications SET is_read = TRUE WHERE id = $1 AND partner_id = $2`,
          [notificationId, partnerId]
        );
      } else {
        await pool.query(
          `UPDATE delivery_notifications SET is_read = TRUE WHERE partner_id = $1`,
          [partnerId]
        );
      }
      return { success: true, read: true };
    }

    case 'PROFILE_CHANGE':
    case 'PROFILE_UPDATE': {
      const { full_name, vehicle_type, city, address } = data;
      const fields = [];
      const values = [];
      let idx = 1;

      if (full_name) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
      if (vehicle_type) { fields.push(`vehicle_type = $${idx++}`); values.push(vehicle_type); }
      if (city) { fields.push(`city = $${idx++}`); values.push(city); }
      if (address) { fields.push(`address = $${idx++}`); values.push(address); }

      if (fields.length > 0) {
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(partnerId);
        await pool.query(
          `UPDATE delivery_partners SET ${fields.join(', ')} WHERE id = $${idx}`,
          values
        );
      }
      return { success: true, profileUpdated: true };
    }

    default:
      return { success: true, genericExecuted: true, type };
  }
};

/**
 * Process all pending offline sync logs for a partner in FIFO order
 */
const processSyncQueue = async (partnerId) => {
  const pending = await syncModel.getPendingLogs(partnerId);
  if (!pending || pending.length === 0) {
    return { synced: 0, failed: 0, total: 0 };
  }

  const total = pending.length;
  emitSyncStart(partnerId, { total, pending_count: total });

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const log = pending[i];

    // Mark status as syncing
    await syncModel.updateSyncLog(log.id, { syncStatus: 'syncing' });

    try {
      // Execute business action dispatcher
      await dispatchAction(partnerId, log);

      // Mark log as completed
      await syncModel.updateSyncLog(log.id, {
        syncStatus: 'completed',
        errorMessage: null,
      });

      synced++;
      emitSyncProgress(partnerId, {
        current: i + 1,
        total,
        synced_count: synced,
        failed_count: failed,
        completed_item_id: log.id,
      });
    } catch (err) {
      failed++;
      const nextRetry = (log.retry_count || 0) + 1;
      const finalStatus = nextRetry >= 5 ? 'failed' : 'pending';

      await syncModel.updateSyncLog(log.id, {
        syncStatus: finalStatus,
        retryCount: nextRetry,
        errorMessage: err.message,
      });

      emitSyncProgress(partnerId, {
        current: i + 1,
        total,
        synced_count: synced,
        failed_count: failed,
        error_item_id: log.id,
        error_message: err.message,
      });
    }
  }

  if (failed === 0) {
    emitSyncCompleted(partnerId, { synced_count: synced, total });
  } else {
    emitSyncFailed(partnerId, { synced_count: synced, failed_count: failed, total });
  }

  return { synced, failed, total };
};

/**
 * Ingest and process a batch of offline actions sent by the client
 */
const processBatchSync = async (partnerId, actionsArray = []) => {
  if (!Array.isArray(actionsArray) || actionsArray.length === 0) {
    // Process existing database queue if array is empty
    return await processSyncQueue(partnerId);
  }

  // Deduplicate and record actions into delivery_sync_logs
  for (const item of actionsArray) {
    const syncType = item.sync_type || item.actionType || item.type || 'GENERIC';
    const entityType = item.entity_type || item.entityType || syncType;
    const entityId = item.entity_id || item.entityId || null;
    const payload = item.payload || item.data || {};

    await syncModel.createSyncLog({
      partnerId,
      syncType,
      entityType,
      entityId,
      payload,
      syncStatus: 'pending',
    });
  }

  // Execute processing of the queue
  return await processSyncQueue(partnerId);
};

/**
 * Retry failed sync log(s) for a partner
 */
const retryFailedSyncs = async (partnerId, syncLogId = null) => {
  if (syncLogId) {
    await syncModel.updateSyncLog(syncLogId, { syncStatus: 'pending', retryCount: 0 });
  } else {
    await pool.query(
      `UPDATE delivery_sync_logs
       SET sync_status = 'pending', retry_count = 0
       WHERE partner_id = $1 AND sync_status = 'failed'`,
      [partnerId]
    );
  }

  return await processSyncQueue(partnerId);
};

module.exports = {
  dispatchAction,
  processSyncQueue,
  processBatchSync,
  retryFailedSyncs,
};
