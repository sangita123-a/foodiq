/**
 * Processes scheduled push marketing campaigns.
 */
const { pool } = require('../config/db');
const { sendPushCampaign } = require('./pushNotificationService');

let running = false;

const processScheduledCampaigns = async () => {
  if (running) return;
  running = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM marketing_campaigns
       WHERE channel = 'push'
         AND status = 'scheduled'
         AND scheduled_at IS NOT NULL
         AND scheduled_at <= CURRENT_TIMESTAMP
       ORDER BY scheduled_at ASC
       LIMIT 10`
    );

    for (const campaign of rows) {
      try {
        await pool.query(
          `UPDATE marketing_campaigns SET status = 'sending', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [campaign.id]
        );

        const meta = typeof campaign.meta === 'object' ? campaign.meta : JSON.parse(campaign.meta || '{}');
        const result = await sendPushCampaign({
          audience: campaign.audience || 'all',
          user_ids: meta.user_ids || [],
          city: meta.city || null,
          restaurant_id: meta.restaurant_id || null,
          title: campaign.subject || campaign.name,
          message: campaign.message,
          type: meta.notification_type || 'coupon_alert',
          link: meta.link || '/notifications',
          skip_log: true,
        });

        await pool.query(
          `UPDATE marketing_campaigns
           SET status = 'sent', sent_count = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [result.sent || 0, campaign.id]
        );
      } catch (err) {
        await pool.query(
          `UPDATE marketing_campaigns
           SET status = 'failed', meta = meta || $2::jsonb, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [campaign.id, JSON.stringify({ error: err.message })]
        );
        console.warn('[scheduled-push] campaign failed:', campaign.id, err.message);
      }
    }
  } finally {
    running = false;
  }
};

const startScheduledPushWorker = () => {
  processScheduledCampaigns().catch((err) =>
    console.warn('[scheduled-push] initial run skipped:', err.message)
  );
  setInterval(() => {
    processScheduledCampaigns().catch((err) =>
      console.warn('[scheduled-push] run skipped:', err.message)
    );
  }, 60_000).unref?.();
};

module.exports = {
  processScheduledCampaigns,
  startScheduledPushWorker,
};
