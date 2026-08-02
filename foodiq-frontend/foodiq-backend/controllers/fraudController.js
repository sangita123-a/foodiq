const FraudModel = require('../models/fraudModel');
const FraudDetectionService = require('../services/fraudDetectionService');
const { getIO } = require('../socket/emitters');
const { roleRoom, userRoom } = require('../socket/rooms');
const EVENTS = require('../socket/events');
const { notify } = require('../services/notificationService');

class FraudController {
  // --- Delivery Partner APIs ---

  static async getDeliveryHistory(req, res, next) {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit || '50', 10);
      const cases = await FraudModel.getPartnerCases(partnerId, limit);

      return res.json({
        success: true,
        data: cases
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDeliveryStatus(req, res, next) {
    try {
      const partnerId = req.user?.id;
      if (!partnerId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const status = await FraudModel.getPartnerFraudStatus(partnerId);

      return res.json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Admin APIs ---

  static async getAdminFraudCases(req, res, next) {
    try {
      const { risk_level, partner_id, order_id, reason, status, limit, offset } = req.query;

      const cases = await FraudModel.getAllCases({
        risk_level,
        partner_id,
        order_id,
        reason,
        status,
        limit: parseInt(limit || '50', 10),
        offset: parseInt(offset || '0', 10)
      });

      const rules = await FraudModel.getRules();

      return res.json({
        success: true,
        data: {
          cases,
          rules
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminFraudCaseById(req, res, next) {
    try {
      const { id } = req.params;
      const fraudCase = await FraudModel.getCaseById(id);

      if (!fraudCase) {
        return res.status(404).json({ success: false, error: 'Fraud case not found' });
      }

      return res.json({
        success: true,
        data: fraudCase
      });
    } catch (err) {
      next(err);
    }
  }

  static async reviewAdminFraudCase(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const { notes } = req.body;

      const updated = await FraudModel.updateCaseStatus(id, {
        status: 'under_review',
        resolved_by: adminId,
        resolution_notes: notes || 'Case placed under manual review'
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Fraud case not found' });
      }

      const io = getIO();
      if (io) {
        io.to(roleRoom('admin')).emit(EVENTS.ADMIN_FRAUD_UPDATE, { case: updated });
      }

      await notify({
        userId: updated.partner_id,
        type: 'fraud_review',
        title: '📋 Case Under Review',
        message: 'Your account flag is currently being reviewed by Foodiq compliance.',
        meta: { case_id: id, link: '/delivery/fraud' }
      });

      return res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async resolveAdminFraudCase(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const { status = 'resolved', notes, restore_partner = true } = req.body;

      if (!['resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Resolution status must be resolved or dismissed' });
      }

      const updated = await FraudModel.updateCaseStatus(id, {
        status,
        resolved_by: adminId,
        resolution_notes: notes || 'Case resolved by administrator'
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Fraud case not found' });
      }

      if (restore_partner && updated.partner_id) {
        const { pool } = require('../config/db');
        await pool.query(
          `UPDATE delivery_partners SET is_available = TRUE, status = 'approved' WHERE user_id = $1`,
          [updated.partner_id]
        );
        await pool.query(
          `UPDATE users SET is_deleted = FALSE WHERE id = $1`,
          [updated.partner_id]
        );
      }

      const io = getIO();
      if (io) {
        io.to(roleRoom('admin')).emit(EVENTS.ADMIN_FRAUD_UPDATE, { case: updated });
        io.to(userRoom(updated.partner_id)).emit(EVENTS.DELIVERY_FRAUD_WARNING, {
          title: 'Case Resolved',
          message: 'Your risk flag has been resolved. Normal operation restored.',
          risk_score: 0
        });
      }

      await notify({
        userId: updated.partner_id,
        type: 'fraud_resolved',
        title: '✅ Case Resolved',
        message: 'Your account flag has been cleared and full delivery privileges restored.',
        meta: { case_id: id, link: '/delivery/fraud' }
      });

      return res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAdminFraudRules(req, res, next) {
    try {
      const { rule_id, threshold, enabled } = req.body;
      if (!rule_id) {
        return res.status(400).json({ success: false, error: 'rule_id is required' });
      }

      const updatedRule = await FraudModel.updateRule(rule_id, { threshold, enabled });
      if (!updatedRule) {
        return res.status(404).json({ success: false, error: 'Fraud rule not found' });
      }

      return res.json({
        success: true,
        data: updatedRule
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FraudController;
