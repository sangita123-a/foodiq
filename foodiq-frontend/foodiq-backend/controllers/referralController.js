const ReferralModel = require('../models/referralModel');
const ReferralService = require('../services/referralService');

class ReferralController {
  /**
   * GET /api/delivery/referral
   */
  static async getDeliveryReferral(req, res) {
    try {
      const partnerId = req.user.partner_id || req.user.id;
      const summary = await ReferralModel.getPartnerReferralSummary(partnerId);
      return res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] getDeliveryReferral error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/delivery/referral/history
   */
  static async getDeliveryReferralHistory(req, res) {
    try {
      const partnerId = req.user.partner_id || req.user.id;
      const summary = await ReferralModel.getPartnerReferralSummary(partnerId);
      return res.json({
        success: true,
        data: {
          history: summary.history,
          stats: summary.stats,
        },
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] getDeliveryReferralHistory error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/delivery/referral/rewards
   */
  static async getDeliveryReferralRewards(req, res) {
    try {
      const partnerId = req.user.partner_id || req.user.id;
      const summary = await ReferralModel.getPartnerReferralSummary(partnerId);
      return res.json({
        success: true,
        data: {
          rewards: summary.rewards,
          total_earned: summary.stats.total_earned,
        },
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] getDeliveryReferralRewards error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/delivery/referral/share
   */
  static async shareDeliveryReferral(req, res) {
    try {
      const partnerId = req.user.partner_id || req.user.id;
      const { platform = 'whatsapp' } = req.body;
      const code = await ReferralModel.getOrCreateReferralCode(partnerId);
      const shareData = ReferralService.getSharePayload(code, platform);

      return res.json({
        success: true,
        data: shareData,
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] shareDeliveryReferral error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/referrals
   */
  static async getAdminReferrals(req, res) {
    try {
      const { status, search, page = 1, limit = 50 } = req.query;
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const result = await ReferralModel.getAdminReferrals({
        status,
        search,
        limit: parseInt(limit, 10),
        offset,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] getAdminReferrals error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/admin/referrals/:id
   */
  static async updateAdminReferral(req, res) {
    try {
      const { id } = req.params;
      const { status, force_credit } = req.body;

      let updated = null;
      if (status) {
        updated = await ReferralModel.updateStatus(id, status);
      }

      if (force_credit || status === 'rewarded') {
        const evalResult = await ReferralService.evaluateAndCreditReward(id);
        return res.json({
          success: true,
          message: 'Referral evaluated and reward processed.',
          data: evalResult,
        });
      }

      return res.json({
        success: true,
        message: 'Referral status updated.',
        data: updated,
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] updateAdminReferral error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/admin/referral-settings
   */
  static async getAdminReferralSettings(req, res) {
    try {
      const settings = await ReferralModel.getSettings();
      return res.json({
        success: true,
        data: settings,
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] getAdminReferralSettings error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * PATCH /api/admin/referral-settings
   */
  static async updateAdminReferralSettings(req, res) {
    try {
      const settings = await ReferralModel.updateSettings(req.body);
      return res.json({
        success: true,
        message: 'Referral settings updated successfully.',
        data: settings,
      });
    } catch (err) {
      console.error('[REFERRAL_CTRL] updateAdminReferralSettings error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = ReferralController;
