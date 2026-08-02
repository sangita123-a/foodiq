const { pool } = require('../config/db');
const { log } = require('../utils/logger');
const { emitEmergencyUpdate } = require('../socket/emitters');

let intervalId = null;

/**
 * Checks for unresolved active emergencies > 5 minutes old.
 * Triggers high-priority escalation notifications & socket alerts to admins.
 */
async function checkUnresolvedEmergencies() {
  try {
    const FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { rows } = await pool.query(
      `SELECT
         e.*,
         dp.full_name AS partner_name,
         dp.phone_number AS partner_phone,
         o.order_number
       FROM delivery_emergencies e
       JOIN delivery_partners dp ON e.partner_id = dp.id
       LEFT JOIN orders o ON e.order_id = o.id
       WHERE e.status = 'active'
         AND e.created_at <= $1`,
      [FIVE_MINUTES_AGO]
    );

    if (rows.length > 0) {
      for (const emergency of rows) {
        log.warn('[EmergencyEscalation] Active SOS unresolved > 5 mins', {
          emergency_id: emergency.id,
          partner_name: emergency.partner_name,
          partner_phone: emergency.partner_phone,
          created_at: emergency.created_at,
        });

        // Broadcast high-priority socket escalation event
        emitEmergencyUpdate({
          ...emergency,
          unresolved_alert: true,
          unresolved_minutes: Math.floor((Date.now() - new Date(emergency.created_at).getTime()) / 60000),
          alert_message: `🚨 HIGH PRIORITY: SOS Unresolved for > 5 Minutes! Partner: ${emergency.partner_name} (${emergency.partner_phone})`,
        });
      }
    }
  } catch (error) {
    log.error('[EmergencyEscalation] Error running escalation worker', { error: error.message });
  }
}

function startEmergencyEscalationWorker() {
  if (intervalId) return;
  // Run check every 60 seconds
  intervalId = setInterval(checkUnresolvedEmergencies, 60 * 1000);
  log.info('[EmergencyEscalationWorker] Background worker started (60s check interval)');
}

function stopEmergencyEscalationWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  checkUnresolvedEmergencies,
  startEmergencyEscalationWorker,
  stopEmergencyEscalationWorker,
};
