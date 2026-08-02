const DispatchModel = require('../models/dispatchModel');
const DispatchEngineService = require('../services/dispatchEngineService');
const emitters = require('../socket/emitters');

/**
 * Controller for AI Dispatch & Smart Order Assignment Engine
 */

exports.runDispatch = async (req, res) => {
  try {
    let { orderId, order_id, forceReassign } = req.body || {};
    const targetOrderId = orderId || order_id;

    let targetId = targetOrderId;
    if (!targetId) {
      // Pick first ready unassigned order if none specified
      const readyOrders = await DispatchModel.getReadyOrders();
      if (!readyOrders || readyOrders.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No unassigned ready orders currently in queue for dispatch.',
          data: {
            status: 'no_orders_ready',
            assigned_partner: null,
            ranked_candidates: [],
          },
        });
      }
      targetId = readyOrders[0].id;
    }

    const result = await DispatchEngineService.evaluateOrderDispatch({
      orderId: targetId,
      triggerType: 'manual_run',
      attemptNumber: forceReassign ? 2 : 1,
    });

    // Emit Socket.IO real-time event
    if (result.assigned_partner) {
      emitters.emitDispatchAssigned({
        order_id: targetId,
        partner: result.assigned_partner,
        dispatch_run_id: result.dispatch_run_id,
        summary: result.summary,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.summary,
      data: result,
    });
  } catch (error) {
    console.error('runDispatch error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Dispatch execution failed',
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { status, order_id, limit = 50, offset = 0 } = req.query;
    const historyData = await DispatchModel.getHistory({
      status: status ? String(status) : undefined,
      order_id: order_id ? String(order_id) : undefined,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    });

    return res.status(200).json({
      success: true,
      data: historyData,
    });
  } catch (error) {
    console.error('getHistory error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dispatch history',
    });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const { dispatch_run_id, order_id, limit = 50 } = req.query;
    const logs = await DispatchModel.getLogs({
      dispatch_run_id: dispatch_run_id ? String(dispatch_run_id) : undefined,
      order_id: order_id ? String(order_id) : undefined,
      limit: parseInt(limit, 10) || 50,
    });

    return res.status(200).json({
      success: true,
      data: {
        logs,
        total: logs.length,
      },
    });
  } catch (error) {
    console.error('getLogs error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dispatch decision logs',
    });
  }
};

exports.getRules = async (req, res) => {
  try {
    const rules = await DispatchModel.getRules();
    return res.status(200).json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('getRules error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dispatch rules',
    });
  }
};

exports.updateRules = async (req, res) => {
  try {
    const rulesData = req.body || {};
    const updatedRules = await DispatchModel.updateRules(rulesData);

    return res.status(200).json({
      success: true,
      message: 'Dispatch scoring rules updated successfully',
      data: updatedRules,
    });
  } catch (error) {
    console.error('updateRules error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update dispatch rules',
    });
  }
};
