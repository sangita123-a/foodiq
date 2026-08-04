const admin = require('../models/adminModel');

const ok = (res, message, data) => res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const getDashboard = async (req, res) => {
  try {
    const data = await admin.getDashboardStats();
    ok(res, 'Dashboard stats retrieved', {
      totalUsers: data.total_users,
      totalRestaurants: data.total_restaurants,
      totalOrders: data.total_orders,
      totalRevenue: data.total_revenue,
      todaysOrders: data.todays_orders,
      todaysRevenue: data.todays_revenue,
      weeklyRevenue: data.weekly_revenue,
      monthlyRevenue: data.monthly_revenue,
      yearlyRevenue: data.yearly_revenue,
      activeDeliveryPartners: data.active_delivery_partners,
      totalDeliveryPartners: data.total_delivery_partners,
      pendingRestaurantApprovals: data.pending_restaurant_approvals,
      pendingPartnerApprovals: data.pending_partner_approvals,
      activeOrders: data.active_orders,
      deliveredOrders: data.delivered_orders,
      cancelledOrders: data.cancelled_orders,
      totalMenuItems: data.total_menu_items,
      avgDeliveryTimeMinutes: data.avg_delivery_time_minutes,
      customerSatisfaction: data.customer_satisfaction,
      weekly: data.weekly,
      monthly: data.monthly,
      orderStatusToday: data.order_status_today,
      customerInsights: data.customer_insights,
      restaurantStatus: data.restaurant_status,
      topRestaurants: data.top_restaurants,
      liveRestaurants: data.live_restaurants,
      peakHours: data.peak_hours,
      openSupportTickets: data.open_support_tickets,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurants = async (req, res) => {
  try {
    const data = await admin.listRestaurants({
      search: req.query.search || '',
      status: req.query.status || '',
      verification: req.query.verification || '',
      city: req.query.city || '',
      zone: req.query.zone || '',
      cuisine: req.query.cuisine || '',
      rating_min: req.query.rating_min || '',
      date_from: req.query.date_from || '',
      date_to: req.query.date_to || '',
      sort: req.query.sort || 'latest',
      page: req.query.page,
      limit: req.query.limit,
    });
    ok(res, 'Restaurants retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurantStats = async (req, res) => {
  try {
    const data = await admin.getRestaurantStats();
    ok(res, 'Restaurant stats retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurantDetail = async (req, res) => {
  try {
    const data = await admin.getRestaurantDetail(req.params.id);
    if (!data) return fail(res, 404, 'Restaurant not found');
    ok(res, 'Restaurant retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const VERIFY_ACTIONS = ['approve', 'reject', 'suspend', 'activate'];

const verifyRestaurantAction = async (req, res) => {
  try {
    const { action, reason } = req.body || {};
    if (!VERIFY_ACTIONS.includes(action)) {
      return fail(res, 400, `action must be one of ${VERIFY_ACTIONS.join(', ')}`);
    }
    if (action === 'reject' && !reason) {
      return fail(res, 400, 'reason is required when rejecting a restaurant');
    }

    const data = await admin.verifyRestaurant(req.params.id, { action, reason });
    if (!data) return fail(res, 404, 'Restaurant not found');

    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: `restaurant.${action}`,
      category: 'restaurant',
      resourceType: 'restaurant',
      resourceId: req.params.id,
      message: reason || null,
      meta: { reason: reason || null },
      req,
    }).catch(() => {});

    try {
      const { emitRestaurantStatus } = require('../socket/emitters');
      emitRestaurantStatus(data, { action });
    } catch {
      /* non-blocking */
    }

    if (data.owner_id) {
      try {
        const { notify } = require('../services/notificationService');
        const titles = {
          approve: 'Restaurant Approved',
          reject: 'Restaurant Rejected',
          suspend: 'Restaurant Suspended',
          activate: 'Restaurant Activated',
        };
        const messages = {
          approve: `${data.name} has been approved and is now live.`,
          reject: `${data.name} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
          suspend: `${data.name} has been suspended by the admin team.${reason ? ` Reason: ${reason}` : ''}`,
          activate: `${data.name} has been reactivated and is now live.`,
        };
        await notify({
          userId: data.owner_id,
          type: `restaurant_${action}`,
          title: titles[action],
          message: messages[action],
          link: '/restaurant/dashboard',
        });
      } catch (err) {
        console.warn('[admin] restaurant verify notification skipped', err.message);
      }
    }

    try {
      const { sendRestaurantStatusEmail } = require('../services/reportEmailService');
      const emailStatus = action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'approved';
      await sendRestaurantStatusEmail(req.params.id, emailStatus);
    } catch (err) {
      console.warn('[admin] restaurant status email skipped', err.message);
    }

    const pastTense = { approve: 'approved', reject: 'rejected', suspend: 'suspended', activate: 'activated' };
    ok(res, `Restaurant ${pastTense[action]} successfully`, data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const getRestaurantVerificationTimeline = async (req, res) => {
  try {
    const data = await admin.getRestaurantVerificationTimeline(req.params.id);
    ok(res, 'Verification timeline retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurantDocuments = async (req, res) => {
  try {
    const docs = require('../models/restaurantDocumentModel');
    const data = await docs.listDocumentsByRestaurant(req.params.id);
    ok(res, 'Restaurant documents retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchRestaurantDocument = async (req, res) => {
  try {
    const docs = require('../models/restaurantDocumentModel');
    const { document_type, document_number, file_url, status, reason } = req.body || {};

    if (status) {
      const rawStatus = String(status).toLowerCase();
      const normalized = rawStatus === 'approve' ? 'approved' : rawStatus === 'reject' ? 'rejected' : rawStatus;
      if (normalized === 'rejected' && !reason) {
        return fail(res, 400, 'reason is required when rejecting a document');
      }
      const data = await docs.reviewDocument(req.params.docId, {
        status: normalized,
        reason,
        verifiedBy: req.user.id,
      });
      if (!data) return fail(res, 404, 'Document not found');
      return ok(res, `Document ${normalized}`, data);
    }

    if (!document_type) return fail(res, 400, 'document_type is required');
    const data = await docs.upsertDocument({
      restaurantId: req.params.id,
      documentType: document_type,
      documentNumber: document_number,
      fileUrl: file_url,
    });
    ok(res, 'Document saved', data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const getRestaurantBankAccount = async (req, res) => {
  try {
    const bankAccounts = require('../models/restaurantBankAccountModel');
    const data = await bankAccounts.getPrimaryForRestaurant(req.params.id);
    ok(res, 'Bank account retrieved', bankAccounts.mapAccount(data));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchRestaurantBankAccount = async (req, res) => {
  try {
    const bankAccounts = require('../models/restaurantBankAccountModel');
    const { status, reason } = req.body || {};

    if (status) {
      const rawStatus = String(status).toLowerCase();
      const normalized = rawStatus === 'approve' ? 'approved' : rawStatus === 'reject' ? 'rejected' : rawStatus;
      if (normalized === 'rejected' && !reason) {
        return fail(res, 400, 'reason is required when rejecting a bank account');
      }
      const existing = await bankAccounts.getPrimaryForRestaurant(req.params.id);
      if (!existing) return fail(res, 404, 'Bank account not found');
      const data = await bankAccounts.reviewBankAccount(existing.id, {
        status: normalized,
        reason,
        verifiedBy: req.user.id,
      });
      return ok(res, `Bank account ${normalized}`, bankAccounts.mapAccount(data));
    }

    const { account_holder_name, account_number, bank_name, ifsc_code, account_type, upi_id } = req.body || {};
    if (!account_holder_name || !account_number || !bank_name || !ifsc_code) {
      return fail(res, 400, 'account_holder_name, account_number, bank_name, and ifsc_code are required');
    }
    const data = await bankAccounts.createOrReplacePrimary({
      restaurantId: req.params.id,
      accountHolderName: account_holder_name,
      accountNumber: account_number,
      bankName: bank_name,
      ifscCode: ifsc_code,
      accountType: account_type,
      upiId: upi_id,
    });
    ok(res, 'Bank account saved', bankAccounts.mapAccount(data));
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const getRestaurantRevenueTrend = async (req, res) => {
  try {
    const data = await admin.getRestaurantRevenueTrend(req.params.id, {
      from: req.query.from || '',
      to: req.query.to || '',
    });
    ok(res, 'Revenue trend retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurantAnalytics = async (req, res) => {
  try {
    const data = await admin.getRestaurantAnalytics(req.params.id, {
      from: req.query.from || '',
      to: req.query.to || '',
    });
    ok(res, 'Restaurant analytics retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurantReviews = async (req, res) => {
  try {
    const data = await admin.listRestaurantReviews(req.params.id, {
      status: req.query.status || '',
      page: req.query.page,
      limit: req.query.limit,
    });
    ok(res, 'Reviews retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchRestaurantReview = async (req, res) => {
  try {
    const { reply, status, reported } = req.body || {};
    let data = null;
    if (reply !== undefined) data = await admin.replyToReview(req.params.reviewId, reply);
    if (status !== undefined) data = await admin.setReviewStatus(req.params.reviewId, status);
    if (reported !== undefined) data = await admin.setReviewReported(req.params.reviewId, reported);
    if (!data) return fail(res, 404, 'Review not found or no changes provided');

    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'review.moderate',
      category: 'restaurant',
      resourceType: 'review',
      resourceId: req.params.reviewId,
      meta: { reply: reply !== undefined, status, reported },
      req,
    }).catch(() => {});

    ok(res, 'Review updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getRestaurantSettlementsScoped = async (req, res) => {
  try {
    const data = await admin.getRestaurantSettlements({
      restaurant_id: req.params.id,
      date_from: req.query.date_from || '',
      date_to: req.query.date_to || '',
    });
    ok(res, 'Settlements retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const bulkRestaurants = async (req, res) => {
  try {
    const { ids, action, reason } = req.body || {};
    if (!Array.isArray(ids) || !ids.length || !VERIFY_ACTIONS.concat('delete').includes(action)) {
      return fail(res, 400, `ids (array) and action (one of ${VERIFY_ACTIONS.concat('delete').join(', ')}) are required`);
    }
    const result = await admin.bulkUpdateRestaurants(ids, action);

    try {
      const { emitRestaurantStatus } = require('../socket/emitters');
      result.succeeded.forEach((row) => {
        emitRestaurantStatus({ id: row.id }, { action });
      });
    } catch {
      /* non-blocking */
    }

    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: `restaurant.bulk_${action}`,
      category: 'restaurant',
      meta: { count: ids.length, action, reason: reason || null, succeeded: result.succeeded.length, failed: result.failed.length },
      req,
    }).catch(() => {});

    ok(res, `${result.succeeded.length} of ${ids.length} restaurants updated`, result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchRestaurant = async (req, res) => {
  try {
    const data = await admin.updateRestaurant(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Restaurant not found');
    if (req.body.approval_status || typeof req.body.is_active === 'boolean') {
      try {
        const { sendRestaurantStatusEmail } = require('../services/reportEmailService');
        const status =
          req.body.approval_status ||
          (req.body.is_active === false ? 'suspended' : 'approved');
        await sendRestaurantStatusEmail(req.params.id, status);
      } catch (err) {
        console.warn('[admin] restaurant status email skipped', err.message);
      }
    }
    ok(res, 'Restaurant updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeRestaurant = async (req, res) => {
  try {
    const data = await admin.deleteRestaurant(req.params.id);
    if (!data) return fail(res, 404, 'Restaurant not found');
    ok(res, 'Restaurant deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const restaurantPerformance = async (req, res) => {
  try {
    const data = await admin.getRestaurantPerformance(req.params.id);
    ok(res, 'Restaurant performance retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const data = await admin.listUsers({
      search: req.query.search || '',
      role: req.query.role || 'customer',
      suspended: req.query.suspended || '',
    });
    ok(res, 'Users retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchUser = async (req, res) => {
  try {
    const data = await admin.updateUser(req.params.id, req.body);
    if (!data) return fail(res, 404, 'User not found or cannot modify admin');
    ok(res, 'User updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeUser = async (req, res) => {
  try {
    const data = await admin.deleteUser(req.params.id);
    if (!data) return fail(res, 404, 'User not found or cannot delete admin');
    ok(res, 'User deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const userOrders = async (req, res) => {
  try {
    const data = await admin.getUserOrders(req.params.id);
    ok(res, 'User orders retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPartners = async (req, res) => {
  try {
    const data = await admin.listDeliveryPartners({
      search: req.query.search || '',
      status: req.query.status || '',
    });
    ok(res, 'Delivery partners retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchPartner = async (req, res) => {
  try {
    const data = await admin.updateDeliveryPartner(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Delivery partner not found');
    if (
      req.body.approval_status &&
      String(req.body.approval_status).toLowerCase() === 'approved'
    ) {
      try {
        const { sendDeliveryApprovalEmail } = require('../services/reportEmailService');
        await sendDeliveryApprovalEmail(data.user_id);
      } catch (err) {
        console.warn('[admin] delivery approval email skipped', err.message);
      }
    }
    ok(res, 'Delivery partner updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getWithdrawals = async (req, res) => {
  try {
    const wallet = require('../models/deliveryWalletModel');
    const data = await wallet.listWithdrawals({
      status: req.query.status || '',
      page: req.query.page,
      limit: req.query.limit,
    });
    ok(res, 'Withdrawal requests retrieved', data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const patchWithdrawal = async (req, res) => {
  try {
    const wallet = require('../models/deliveryWalletModel');
    const rawAction = String(req.body.action || req.body.status || '').toLowerCase();
    const action = rawAction === 'approved' ? 'approve' : rawAction === 'rejected' ? 'reject' : rawAction;
    const adminNote = req.body.admin_note || req.body.note || '';
    const data = await wallet.processWithdrawal(req.params.id, action, adminNote);
    ok(res, `Withdrawal request ${data.status}`, data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const getKycDocuments = async (req, res) => {
  try {
    const docs = require('../models/deliveryDocumentModel');
    const data = await docs.listAllForAdmin({
      status: req.query.status || '',
      documentType: req.query.document_type || '',
      search: req.query.search || '',
      page: req.query.page,
      limit: req.query.limit,
    });
    ok(res, 'KYC documents retrieved', data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const patchKycDocument = async (req, res) => {
  try {
    const docs = require('../models/deliveryDocumentModel');
    const rawStatus = String(req.body.status || req.body.action || '').toLowerCase();
    const status = rawStatus === 'approve' ? 'approved' : rawStatus === 'reject' ? 'rejected' : rawStatus;
    const reason = req.body.reason || req.body.rejection_reason || '';

    if (status === 'rejected' && !reason) {
      return fail(res, 400, 'reason is required when rejecting a document');
    }

    const data = await docs.reviewDocument(req.params.id, {
      status,
      reason,
      verifiedBy: req.user.id,
    });
    if (!data) return fail(res, 404, 'Document not found');
    ok(res, `Document ${status}`, data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const getDeliveryBankAccounts = async (req, res) => {
  try {
    const bankAccounts = require('../models/deliveryBankAccountModel');
    const data = await bankAccounts.listAllForAdmin({
      status: req.query.status || '',
      search: req.query.search || '',
      page: req.query.page,
      limit: req.query.limit,
    });
    ok(res, 'Delivery partner bank accounts retrieved', data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const patchDeliveryBankAccount = async (req, res) => {
  try {
    const bankAccounts = require('../models/deliveryBankAccountModel');
    const rawStatus = String(req.body.status || req.body.action || '').toLowerCase();
    const status = rawStatus === 'approve' ? 'approved' : rawStatus === 'reject' ? 'rejected' : rawStatus;
    const reason = req.body.reason || req.body.rejection_reason || '';

    if (status === 'rejected' && !reason) {
      return fail(res, 400, 'reason is required when rejecting a bank account');
    }

    const data = await bankAccounts.reviewBankAccount(req.params.id, {
      status,
      reason,
      verifiedBy: req.user.id,
    });
    if (!data) return fail(res, 404, 'Bank account not found');
    ok(res, `Bank account ${status}`, bankAccounts.mapAccount(data));
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error', error.message);
  }
};

const getOrders = async (req, res) => {
  try {
    const data = await admin.listOrders({
      search: req.query.search || '',
      status: req.query.status || '',
      restaurant_id: req.query.restaurant_id || '',
      delivery_partner_id: req.query.delivery_partner_id || '',
      payment_method: req.query.payment_method || '',
      payment_status: req.query.payment_status || '',
      city: req.query.city || '',
      from: req.query.from || '',
      to: req.query.to || '',
      sort: req.query.sort || 'latest',
      page: req.query.page,
      limit: req.query.limit,
    });
    ok(res, 'Orders retrieved', { rows: data.rows, pagination: data.pagination });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrderStats = async (req, res) => {
  try {
    const data = await admin.getOrderStats();
    ok(res, 'Order stats retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrder = async (req, res) => {
  try {
    const data = await admin.getOrderDetails(req.params.id);
    if (!data) return fail(res, 404, 'Order not found');
    ok(res, 'Order retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const order = await admin.getOrderDetails(req.params.id);
    if (!order) return fail(res, 404, 'Order not found');
    ok(res, 'Order history retrieved', order.timeline);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const downloadOrderInvoice = async (req, res) => {
  try {
    const { buildInvoicePdfForOrder } = require('../services/invoiceService');
    const pdf = await buildInvoicePdfForOrder(req.params.id, null);
    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'order.invoice_download',
      category: 'orders',
      resourceType: 'order',
      resourceId: req.params.id,
      req,
    }).catch(() => {});
    const shortId = String(req.params.id).replace(/-/g, '').slice(0, 8).toUpperCase();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="foodiq-invoice-${shortId}.pdf"`);
    res.send(pdf);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

const patchOrder = async (req, res) => {
  try {
    const data = await admin.updateOrderAdmin(req.params.id, req.body, { id: req.user.id });
    if (!data) return fail(res, 404, 'Order not found');

    if (req.body?.status) {
      try {
        const { emitOrderStatus } = require('../socket/emitters');
        emitOrderStatus(
          {
            id: data.id || req.params.id,
            status: req.body.status,
            user_id: data.user_id,
            restaurant_id: data.restaurant_id,
            total_amount: data.total_amount,
          },
          { source: 'admin' }
        );
      } catch (socketErr) {
        console.warn('[admin] socket emit skipped:', socketErr.message);
      }
    }

    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'order.update',
      category: 'orders',
      resourceType: 'order',
      resourceId: req.params.id,
      meta: { status: req.body?.status, delivery_partner_id: req.body?.delivery_partner_id, estimated_delivery_time: req.body?.estimated_delivery_time, scheduled_for: req.body?.scheduled_for },
      req,
    }).catch(() => {});

    ok(res, 'Order updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const refund = async (req, res) => {
  try {
    const { processRefund } = require('./paymentController');
    const data = await processRefund({
      orderId: req.params.id,
      amount: req.body?.amount,
      reason: req.body?.reason || 'Admin refund',
      initiatedBy: req.user.id,
      type: req.body?.type || (req.body?.amount ? 'partial' : 'full'),
      cancelOrder: req.body?.cancel_order !== false,
    });

    try {
      const { recordStatusChange } = require('../models/orderStatusHistoryModel');
      await recordStatusChange({
        orderId: req.params.id,
        toStatus: 'Refund Completed',
        changedBy: req.user.id,
        source: 'admin',
        reason: req.body?.reason || 'Admin refund',
        meta: { amount: req.body?.amount, type: req.body?.type },
      });
    } catch {
      /* non-blocking */
    }

    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'order.refund',
      category: 'orders',
      resourceType: 'order',
      resourceId: req.params.id,
      meta: { amount: req.body?.amount, type: req.body?.type },
      req,
    }).catch(() => {});

    ok(res, 'Order refunded', data);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status, reason } = req.body || {};
    if (!Array.isArray(ids) || !ids.length || !status) {
      return fail(res, 400, 'ids (array) and status are required');
    }
    const result = await admin.bulkUpdateOrderStatus(ids, status, reason, { id: req.user.id });
    try {
      const { emitOrderStatus } = require('../socket/emitters');
      result.succeeded.forEach((row) => {
        emitOrderStatus({ id: row.id, status }, { source: 'admin' });
      });
    } catch {
      /* non-blocking */
    }
    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'order.bulk_status',
      category: 'orders',
      meta: { count: ids.length, status, succeeded: result.succeeded.length, failed: result.failed.length },
      req,
    }).catch(() => {});
    ok(res, `${result.succeeded.length} of ${ids.length} orders updated`, result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const bulkAssignPartner = async (req, res) => {
  try {
    const { ids, delivery_partner_id } = req.body || {};
    if (!Array.isArray(ids) || !ids.length || !delivery_partner_id) {
      return fail(res, 400, 'ids (array) and delivery_partner_id are required');
    }
    const result = await admin.bulkAssignDeliveryPartner(ids, delivery_partner_id, { id: req.user.id });
    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'order.bulk_assign',
      category: 'orders',
      meta: { count: ids.length, delivery_partner_id, succeeded: result.succeeded.length, failed: result.failed.length },
      req,
    }).catch(() => {});
    ok(res, `${result.succeeded.length} of ${ids.length} orders assigned`, result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const bulkCancelOrders = async (req, res) => {
  try {
    const { ids, reason } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      return fail(res, 400, 'ids (array) is required');
    }
    const result = await admin.bulkUpdateOrderStatus(ids, 'Cancelled', reason, { id: req.user.id });
    try {
      const { emitOrderStatus } = require('../socket/emitters');
      result.succeeded.forEach((row) => {
        emitOrderStatus({ id: row.id, status: 'Cancelled' }, { source: 'admin' });
      });
    } catch {
      /* non-blocking */
    }
    const { writeAudit } = require('../services/auditService');
    writeAudit({
      userId: req.user.id,
      role: req.user.role,
      action: 'order.bulk_cancel',
      category: 'orders',
      meta: { count: ids.length, succeeded: result.succeeded.length, failed: result.failed.length },
      req,
    }).catch(() => {});
    ok(res, `${result.succeeded.length} of ${ids.length} orders cancelled`, result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPaymentsOverview = async (req, res) => {
  try {
    const {
      adminPaymentOverview,
    } = require('./paymentController');
    return adminPaymentOverview(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const getPaymentTransactions = async (req, res) => {
  try {
    const { adminListTransactions } = require('./paymentController');
    return adminListTransactions(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const getRefunds = async (req, res) => {
  try {
    const { adminListRefunds } = require('./paymentController');
    return adminListRefunds(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const postRefund = async (req, res) => {
  try {
    const { adminCreateRefund } = require('./paymentController');
    return adminCreateRefund(req, res);
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const getMenu = async (req, res) => {
  try {
    const data = await admin.listMenuItems({
      search: req.query.search || '',
      restaurant_id: req.query.restaurant_id || '',
    });
    ok(res, 'Menu items retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeMenuItem = async (req, res) => {
  try {
    const data = await admin.deleteMenuItem(req.params.id);
    if (!data) return fail(res, 404, 'Menu item not found');
    ok(res, 'Menu item deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCategories = async (req, res) => {
  try {
    const data = await admin.listCategories();
    ok(res, 'Categories retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCoupons = async (req, res) => {
  try {
    ok(res, 'Coupons retrieved', await admin.listCoupons());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postCoupon = async (req, res) => {
  try {
    if (!req.body.code || req.body.discount_amount == null) {
      return fail(res, 400, 'Code and discount_amount are required');
    }
    const data = await admin.createCoupon(req.body);
    try {
      const { sendMarketingByType } = require('../services/pushNotificationService');
      const couponType = req.body.coupon_type || 'coupon_alert';
      const marketingType =
        couponType === 'festival' ? 'festival_discount' : couponType === 'first_order' ? 'new_offer' : 'coupon_alert';
      await sendMarketingByType(marketingType, {
        title: `New Coupon: ${data.code}`,
        message: req.body.title || `Use code ${data.code} on your next order!`,
        link: '/coupons',
      });
    } catch (pushErr) {
      console.warn('[admin] coupon push skipped:', pushErr.message);
    }
    res.status(201).json({ success: true, message: 'Coupon created', data });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchCoupon = async (req, res) => {
  try {
    const data = await admin.updateCoupon(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Coupon not found');
    ok(res, 'Coupon updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeCoupon = async (req, res) => {
  try {
    const data = await admin.deleteCoupon(req.params.id);
    if (!data) return fail(res, 404, 'Coupon not found');
    ok(res, 'Coupon deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCouponAnalytics = async (req, res) => {
  try {
    ok(res, 'Coupon analytics retrieved', await admin.getCouponAnalytics());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAnalytics = async (req, res) => {
  try {
    ok(res, 'Analytics retrieved', await admin.getAnalytics());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postBroadcast = async (req, res) => {
  try {
    const {
      audience = 'all',
      title,
      message,
      user_ids,
      city,
      restaurant_id,
      type,
      link,
      schedule_at,
    } = req.body;
    if (!title || !message) return fail(res, 400, 'Title and message are required');
    const data = await admin.broadcastNotification({
      audience,
      title,
      message,
      user_ids,
      city,
      restaurant_id,
      type,
      link,
      schedule_at,
      created_by: req.user.id,
    });
    ok(res, data.scheduled ? 'Notification scheduled' : 'Notifications sent', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postPushCampaign = async (req, res) => {
  try {
    const data = await admin.broadcastNotification({
      ...req.body,
      created_by: req.user.id,
    });
    ok(res, data.scheduled ? 'Push notification scheduled' : 'Push notifications sent', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getScheduledPushCampaigns = async (req, res) => {
  try {
    const { rows } = await require('../config/db').pool.query(
      `SELECT id, name, audience, subject, message, status, scheduled_at, sent_count, created_at
       FROM marketing_campaigns
       WHERE channel = 'push'
       ORDER BY created_at DESC
       LIMIT 50`
    );
    ok(res, 'Scheduled push campaigns retrieved', rows);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPushTargetOptions = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const [cities, restaurants] = await Promise.all([
      pool.query(
        `SELECT DISTINCT TRIM(city) AS city FROM addresses
         WHERE city IS NOT NULL AND TRIM(city) <> ''
         ORDER BY city LIMIT 100`
      ),
      pool.query(
        `SELECT id, name, city FROM restaurants ORDER BY name LIMIT 200`
      ),
    ]);
    ok(res, 'Push target options retrieved', {
      cities: cities.rows.map((r) => r.city),
      restaurants: restaurants.rows,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSettings = async (req, res) => {
  try {
    ok(res, 'Settings retrieved', await admin.getSettings());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const putSettings = async (req, res) => {
  try {
    ok(res, 'Settings updated', await admin.updateSettings(req.body));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

// Legacy report endpoints
const getReportTemplate = async (req, res, queryField, table, dateCol) => {
  try {
    const { pool } = require('../config/db');
    const { range = 'monthly', start_date, end_date } = req.query;
    let dateTrunc = 'day';
    if (range === 'monthly') dateTrunc = 'month';
    else if (range === 'weekly') dateTrunc = 'week';

    let query = `
      SELECT date_trunc($1, ${dateCol}) as period, ${queryField} as total
      FROM ${table}
    `;
    const values = [dateTrunc];
    const conditions = [];
    if (table === 'orders' && queryField.includes('SUM')) {
      conditions.push("status = 'Delivered'");
    }
    if (start_date && end_date) {
      conditions.push(`CAST(${dateCol} AS DATE) >= $2`);
      conditions.push(`CAST(${dateCol} AS DATE) <= $3`);
      values.push(start_date, end_date);
    }
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` GROUP BY period ORDER BY period DESC LIMIT 30`;
    const { rows } = await pool.query(query, values);
    ok(res, 'Report retrieved', rows);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSalesReports = (req, res) => getReportTemplate(req, res, 'SUM(total_amount)', 'orders', 'created_at');
const getOrderReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'orders', 'created_at');
const getUserReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'users', 'created_at');
const getRestaurantReports = (req, res) => getReportTemplate(req, res, 'COUNT(*)', 'restaurants', 'created_at');

const getLiveDeliveries = async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const { getLiveDeliveries: fetchLive, getDelayedOrders } = require('../services/trackingService');
    const live = await fetchLive();
    const delayed = await getDelayedOrders();
    const cancelled = await pool.query(
      `SELECT o.id, o.status, o.created_at, r.name AS restaurant_name
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE LOWER(o.status) IN ('cancelled', 'rejected')
         AND o.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
       ORDER BY o.created_at DESC
       LIMIT 30`
    );
    ok(res, 'Live deliveries retrieved', {
      live_deliveries: live,
      delayed_orders: delayed,
      cancelled_orders: cancelled.rows,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getStaff = async (req, res) => {
  try {
    ok(res, 'Admin staff retrieved', await admin.listAdminStaff());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postStaff = async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { email, password, full_name, phone_number, admin_role } = req.body;
    if (!email || !password || !full_name) {
      return fail(res, 400, 'Email, password, and name are required');
    }
    const password_hash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_ROUNDS || 12)
    );
    const data = await admin.createAdminStaff({
      email: String(email).trim().toLowerCase(),
      password_hash,
      full_name,
      phone_number,
      admin_role: admin_role || 'admin',
    });
    ok(res, 'Admin staff created', data);
  } catch (error) {
    if (error.code === '23505') return fail(res, 409, 'Email already exists');
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchStaff = async (req, res) => {
  try {
    let password_hash;
    if (req.body.password) {
      const bcrypt = require('bcrypt');
      password_hash = await bcrypt.hash(req.body.password, Number(process.env.BCRYPT_ROUNDS || 12));
    }
    const data = await admin.updateAdminStaff(req.params.id, {
      ...req.body,
      password_hash,
    });
    if (!data) return fail(res, 404, 'Staff member not found');
    ok(res, 'Staff updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeStaff = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return fail(res, 400, 'Cannot delete your own account');
    }
    const data = await admin.deleteAdminStaff(req.params.id);
    if (!data) return fail(res, 404, 'Staff member not found');
    ok(res, 'Staff deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const userWallet = async (req, res) => {
  try {
    ok(res, 'User wallet retrieved', await admin.getUserWallet(req.params.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const userReferrals = async (req, res) => {
  try {
    ok(res, 'User referrals retrieved', await admin.getUserReferrals(req.params.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getCms = async (req, res) => {
  try {
    ok(res, 'CMS content retrieved', await admin.listCmsContent());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const putCms = async (req, res) => {
  try {
    const data = await admin.upsertCmsContent(req.body);
    ok(res, 'CMS content saved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const removeCms = async (req, res) => {
  try {
    const data = await admin.deleteCmsContent(req.params.key);
    if (!data) return fail(res, 404, 'Content not found');
    ok(res, 'CMS content deleted', {});
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMarketing = async (req, res) => {
  try {
    const campaigns = await admin.listMarketingCampaigns({
      channel: req.query.channel || '',
      status: req.query.status || '',
    });
    const seasonal = await admin.listSeasonalCampaigns();
    ok(res, 'Marketing data retrieved', { campaigns, seasonal });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postMarketing = async (req, res) => {
  try {
    const data = await admin.createMarketingCampaign({
      ...req.body,
      created_by: req.user.id,
    });
    ok(res, 'Campaign created', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchMarketing = async (req, res) => {
  try {
    const data = await admin.updateMarketingCampaign(req.params.id, req.body);
    if (!data) return fail(res, 404, 'Campaign not found');
    ok(res, 'Campaign updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postSeasonal = async (req, res) => {
  try {
    ok(res, 'Seasonal campaign saved', await admin.upsertSeasonalCampaign(req.body));
  } catch (error) {
    if (error.code === '23505') return fail(res, 409, 'Slug already exists');
    fail(res, 500, 'Server Error', error.message);
  }
};

const sendMarketingCampaign = async (req, res) => {
  try {
    const campaign = await admin.updateMarketingCampaign(req.params.id, { status: 'sending' });
    if (!campaign) return fail(res, 404, 'Campaign not found');

    let sent = 0;
    if (campaign.channel === 'push') {
      const result = await admin.broadcastNotification({
        audience: campaign.audience || 'all',
        title: campaign.subject || campaign.name,
        message: campaign.message,
      });
      sent = result.sent;
    } else if (campaign.channel === 'email' || campaign.channel === 'sms') {
      const messaging = require('../controllers/messagingController');
      const fakeReq = {
        body: {
          audience: campaign.audience || 'all',
          subject: campaign.subject || campaign.name,
          message: campaign.message,
          template: 'promo',
        },
        user: req.user,
      };
      const fakeRes = {
        json: (payload) => payload,
        status: () => ({ json: () => ({}) }),
      };
      if (campaign.channel === 'email') {
        await messaging.postPromo(fakeReq, fakeRes);
      } else {
        await messaging.postPromo(fakeReq, fakeRes);
      }
      sent = 1;
    }

    const updated = await admin.updateMarketingCampaign(req.params.id, {
      status: 'sent',
      sent_count: sent,
    });
    ok(res, 'Campaign sent', updated);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSecurity = async (req, res) => {
  try {
    const { ADMIN_ROLES, ROLE_LABELS, ROLE_PERMISSIONS } = require('../utils/adminPermissions');
    const loginLogs = await admin.getAdminLoginLogs({ limit: 100 });
    const auditLogs = await admin.getAuditLogs({ limit: 100, category: req.query.category || '' });
    ok(res, 'Security data retrieved', {
      roles: ADMIN_ROLES.map((r) => ({ id: r, label: ROLE_LABELS[r], permissions: ROLE_PERMISSIONS[r] })),
      login_logs: loginLogs,
      audit_logs: auditLogs,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getPaymentReportHandler = async (req, res) => {
  try {
    ok(res, 'Payment report retrieved', await admin.getPaymentReport(req.query));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getDeliveryReportHandler = async (req, res) => {
  try {
    ok(res, 'Delivery report retrieved', await admin.getDeliveryReport());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSettlements = async (req, res) => {
  try {
    ok(res, 'Settlements retrieved', await admin.getRestaurantSettlements());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const ORDER_EXPORT_COLUMNS = [
  { key: 'id', label: 'Order ID' },
  { key: 'created_at', label: 'Created' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'restaurant_name', label: 'Restaurant' },
  { key: 'delivery_partner_name', label: 'Delivery Partner' },
  { key: 'item_count', label: 'Items' },
  { key: 'total_amount', label: 'Total Amount' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'status', label: 'Order Status' },
  { key: 'city', label: 'City' },
  { key: 'estimated_delivery_time', label: 'Expected Delivery' },
];

const RESTAURANT_EXPORT_COLUMNS = [
  { key: 'id', label: 'Restaurant ID' },
  { key: 'name', label: 'Restaurant Name' },
  { key: 'owner_name', label: 'Owner' },
  { key: 'owner_email', label: 'Email' },
  { key: 'owner_phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'zone', label: 'Zone' },
  { key: 'category_name', label: 'Cuisine' },
  { key: 'rating', label: 'Rating' },
  { key: 'approval_status', label: 'Status' },
  { key: 'orders_today', label: 'Orders Today' },
  { key: 'revenue_today', label: 'Revenue Today' },
  { key: 'created_at', label: 'Created' },
];

const exportReport = async (req, res) => {
  try {
    const { type = 'sales', format = 'json', start_date, end_date } = req.query;
    let rows = [];
    let columns = null;
    if (type === 'sales' || type === 'payment') {
      rows = await admin.getPaymentReport({ start_date, end_date, group_by: 'day' });
    } else if (type === 'delivery') {
      rows = await admin.getDeliveryReport();
    } else if (type === 'restaurants') {
      const data = await admin.listRestaurants({
        search: req.query.search || '',
        status: req.query.status || '',
        verification: req.query.verification || '',
        city: req.query.city || '',
        zone: req.query.zone || '',
        cuisine: req.query.cuisine || '',
        sort: req.query.sort || 'latest',
        page: 1,
        limit: 500,
        maxLimit: 500,
      });
      rows = data.rows;
      columns = RESTAURANT_EXPORT_COLUMNS;
    } else if (type === 'customers') {
      rows = await admin.listUsers({ role: 'customer' });
    } else if (type === 'orders') {
      const data = await admin.listOrders({
        search: req.query.search || '',
        status: req.query.status || '',
        restaurant_id: req.query.restaurant_id || '',
        delivery_partner_id: req.query.delivery_partner_id || '',
        payment_method: req.query.payment_method || '',
        payment_status: req.query.payment_status || '',
        city: req.query.city || '',
        from: req.query.from || start_date || '',
        to: req.query.to || end_date || '',
        sort: req.query.sort || 'latest',
        page: 1,
        limit: 500,
        maxLimit: 500,
      });
      rows = data.rows;
      columns = ORDER_EXPORT_COLUMNS;
    }

    if (format === 'pdf' && type === 'orders') {
      const { buildOrdersExportPdf } = require('../services/orderExportPdfService');
      const pdf = await buildOrdersExportPdf(rows, ORDER_EXPORT_COLUMNS);
      const { writeAudit } = require('../services/auditService');
      writeAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'order.export',
        category: 'orders',
        meta: { format, count: rows.length },
        req,
      }).catch(() => {});
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="orders-export.pdf"');
      return res.send(pdf);
    }

    if ((format === 'pdf' || format === 'xlsx') && type === 'restaurants') {
      const restaurantExport = require('../services/restaurantExportService');
      const { writeAudit } = require('../services/auditService');
      writeAudit({
        userId: req.user.id,
        role: req.user.role,
        action: 'restaurant.export',
        category: 'restaurant',
        meta: { format, count: rows.length },
        req,
      }).catch(() => {});

      if (format === 'pdf') {
        const pdf = await restaurantExport.buildRestaurantsExportPdf(rows, RESTAURANT_EXPORT_COLUMNS);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="restaurants-export.pdf"');
        return res.send(pdf);
      }
      const xlsx = await restaurantExport.buildRestaurantsExportXlsx(rows, RESTAURANT_EXPORT_COLUMNS);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="restaurants-export.xlsx"');
      return res.send(xlsx);
    }

    if (format === 'csv') {
      if (!rows.length) {
        res.setHeader('Content-Type', 'text/csv');
        return res.send('No data');
      }
      const cols = columns || Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
      const csv = [cols.map((c) => c.label).join(',')].concat(
        rows.map((r) => cols.map((c) => JSON.stringify(r[c.key] ?? '')).join(','))
      ).join('\n');
      if (type === 'orders' || type === 'restaurants') {
        const { writeAudit } = require('../services/auditService');
        writeAudit({
          userId: req.user.id,
          role: req.user.role,
          action: `${type === 'orders' ? 'order' : 'restaurant'}.export`,
          category: type === 'orders' ? 'orders' : 'restaurant',
          meta: { format, count: rows.length },
          req,
        }).catch(() => {});
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      return res.send(csv);
    }

    ok(res, 'Report exported', { type, rows, count: rows.length });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getLoyaltyOverview = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const [analytics, rules, tiers] = await Promise.all([
      loyaltyModel.getAnalytics(),
      loyaltyModel.listRules(),
      loyaltyModel.listTiers(),
    ]);
    ok(res, 'Loyalty overview retrieved', { analytics, rules, tiers });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchLoyaltyRule = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const data = await loyaltyModel.updateRule(req.params.key, req.body);
    if (!data) return fail(res, 404, 'Rule not found');
    ok(res, 'Loyalty rule updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const patchLoyaltyTier = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const data = await loyaltyModel.updateTier(req.params.slug, req.body);
    if (!data) return fail(res, 404, 'Tier not found');
    ok(res, 'Membership tier updated', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLoyaltyAdjust = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const { user_id, points, reason } = req.body;
    if (!user_id || !points) return fail(res, 400, 'user_id and points are required');
    const result = await loyaltyModel.adminAdjustPoints(user_id, Number(points), reason, req.user.id);
    ok(res, 'Points adjusted', result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLoyaltyExpire = async (req, res) => {
  try {
    const loyaltyModel = require('../models/loyaltyModel');
    const result = await loyaltyModel.expirePoints(req.body.user_id || null);
    ok(res, 'Expired points processed', result);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postLoyaltyCampaign = async (req, res) => {
  try {
    const loyaltyEngine = require('../services/loyaltyEngine');
    const { user_ids = [], points, campaign_id } = req.body;
    if (!Array.isArray(user_ids) || !user_ids.length) {
      return fail(res, 400, 'user_ids array required');
    }
    let credited = 0;
    for (const uid of user_ids) {
      const r = await loyaltyEngine.creditCampaign(uid, campaign_id || `campaign:${Date.now()}`, points);
      if (r && !r.duplicate) credited += 1;
    }
    ok(res, 'Campaign rewards credited', { credited, total: user_ids.length });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportCenter = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const analytics = await helpCenter.getAnalytics();
    ok(res, 'Support analytics retrieved', analytics);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    ok(res, 'Tickets retrieved', await helpCenter.listAllTickets({
      status: req.query.status || '',
      category: req.query.category || '',
    }));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const assignSupportTicket = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const ticket = await helpCenter.assignTicket(req.params.id, req.body.agent_id || req.user.id);
    if (!ticket) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket assigned', ticket);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const resolveSupportTicket = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const ticket = await helpCenter.resolveTicket(req.params.id, req.body.admin_notes);
    if (!ticket) return fail(res, 404, 'Ticket not found');
    ok(res, 'Ticket resolved', ticket);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportLiveChats = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    ok(res, 'Live chats retrieved', await helpCenter.listActiveChats());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportLiveChatDetail = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    const chat = await helpCenter.getLiveChat(req.params.id);
    if (!chat) return fail(res, 404, 'Chat not found');
    const messages = await helpCenter.getLiveMessages(req.params.id);
    ok(res, 'Live chat detail', { chat, messages });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const postSupportAgentMessage = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    await helpCenter.assignLiveChat(req.params.id, req.user.id);
    const msg = await helpCenter.addLiveMessage({
      chatId: req.params.id,
      senderId: req.user.id,
      senderRole: 'agent',
      message: req.body.message,
      attachmentUrl: req.body.attachment_url,
      attachmentType: req.body.attachment_type,
    });
    try {
      const { getIO } = require('../socket/emitters');
      getIO()?.to(`support:${req.params.id}`).emit('supportMessage', msg);
    } catch {
      /* optional */
    }
    ok(res, 'Message sent', msg, 201);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getSupportAiSessions = async (req, res) => {
  try {
    const helpCenter = require('../models/helpCenterModel');
    ok(res, 'AI sessions retrieved', await helpCenter.listAiSessions({ limit: 50 }));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getAdminInventory = async (req, res) => {
  try {
    const inventory = require('../models/inventoryModel');
    ok(res, 'Inventory health overview', await inventory.adminInventoryOverview());
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

/**
 * POST /api/admin/delivery/notifications/send — Admin sends a notification to one delivery partner.
 */
const sendDeliveryNotification = async (req, res) => {
  try {
    const dn = require('../models/deliveryNotificationModel');
    const { partner_id, title, message, type } = req.body || {};
    if (!partner_id || !title || !message) {
      return fail(res, 400, 'partner_id, title and message are required.');
    }
    const notification = await dn.createNotification({
      partnerId: partner_id,
      type: type || 'admin_message',
      title,
      message,
    });
    ok(res, 'Notification sent to delivery partner', notification);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Failed to send notification.');
  }
};

/**
 * GET /api/admin/delivery/notifications — recent sends across all partners (audit view).
 */
const getDeliveryNotifications = async (req, res) => {
  try {
    const dn = require('../models/deliveryNotificationModel');
    const { pool } = require('../config/db');
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const { rows } = await pool.query(
      `SELECT n.*, u.full_name AS partner_name, u.email AS partner_email
       FROM delivery_notifications n
       JOIN delivery_partners dp ON dp.id = n.partner_id
       JOIN users u ON u.id = dp.user_id
       ORDER BY n.created_at DESC
       LIMIT $1`,
      [limit]
    );
    ok(res, 'Recent notifications retrieved', { notifications: rows, types: dn.NOTIFICATION_TYPES });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

/**
 * GET /api/admin/delivery/support — list/search/filter delivery partner support tickets.
 */
const getDeliverySupportTickets = async (req, res) => {
  try {
    const support = require('../models/deliverySupportModel');
    const data = await support.listAllTickets({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status || '',
      search: req.query.search || '',
    });
    ok(res, 'Support tickets retrieved', data);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

/**
 * PATCH /api/admin/delivery/support/:id — reply to and/or change the status of a ticket.
 */
const patchDeliverySupportTicket = async (req, res) => {
  try {
    const support = require('../models/deliverySupportModel');
    const { admin_reply, status } = req.body || {};
    const ticket = await support.replyToTicket(req.params.id, { adminReply: admin_reply, status });
    if (!ticket) return fail(res, 404, 'Support ticket not found.');
    ok(res, 'Support ticket updated', ticket);
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Failed to update support ticket.');
  }
};

module.exports = {
  ORDER_EXPORT_COLUMNS,
  RESTAURANT_EXPORT_COLUMNS,
  getDashboard,
  getLiveDeliveries,
  getRestaurants,
  getRestaurantStats,
  getRestaurantDetail,
  verifyRestaurantAction,
  getRestaurantVerificationTimeline,
  getRestaurantDocuments,
  patchRestaurantDocument,
  getRestaurantBankAccount,
  patchRestaurantBankAccount,
  getRestaurantRevenueTrend,
  getRestaurantAnalytics,
  getRestaurantReviews,
  patchRestaurantReview,
  getRestaurantSettlementsScoped,
  bulkRestaurants,
  patchRestaurant,
  removeRestaurant,
  restaurantPerformance,
  getUsers,
  patchUser,
  removeUser,
  userOrders,
  getPartners,
  patchPartner,
  getWithdrawals,
  patchWithdrawal,
  getKycDocuments,
  patchKycDocument,
  getDeliveryBankAccounts,
  patchDeliveryBankAccount,
  sendDeliveryNotification,
  getDeliveryNotifications,
  getDeliverySupportTickets,
  patchDeliverySupportTicket,
  getOrders,
  getOrderStats,
  getOrder,
  getOrderHistory,
  downloadOrderInvoice,
  patchOrder,
  refund,
  bulkUpdateStatus,
  bulkAssignPartner,
  bulkCancelOrders,
  getPaymentsOverview,
  getPaymentTransactions,
  getRefunds,
  postRefund,
  getMenu,
  removeMenuItem,
  getCategories,
  getCoupons,
  postCoupon,
  patchCoupon,
  removeCoupon,
  getCouponAnalytics,
  getAnalytics,
  postBroadcast,
  postPushCampaign,
  getScheduledPushCampaigns,
  getPushTargetOptions,
  getSettings,
  putSettings,
  getSalesReports,
  getOrderReports,
  getUserReports,
  getRestaurantReports,
  getStaff,
  postStaff,
  patchStaff,
  removeStaff,
  userWallet,
  userReferrals,
  getCms,
  putCms,
  removeCms,
  getMarketing,
  postMarketing,
  patchMarketing,
  postSeasonal,
  sendMarketingCampaign,
  getSecurity,
  getPaymentReportHandler,
  getDeliveryReportHandler,
  getSettlements,
  exportReport,
  getLoyaltyOverview,
  patchLoyaltyRule,
  patchLoyaltyTier,
  postLoyaltyAdjust,
  postLoyaltyExpire,
  postLoyaltyCampaign,
  getSupportCenter,
  getSupportTickets,
  assignSupportTicket,
  resolveSupportTicket,
  getSupportLiveChats,
  getSupportLiveChatDetail,
  postSupportAgentMessage,
  getSupportAiSessions,
  getAdminInventory,
};
