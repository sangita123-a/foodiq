const FraudModel = require('../models/fraudModel');
const EVENTS = require('../socket/events');
const { getIO } = require('../socket/emitters');
const { userRoom, roleRoom } = require('../socket/rooms');
const { notify } = require('./notificationService');
const { pool } = require('../config/db');

class FraudDetectionService {
  /**
   * Main evaluation runner triggered by backend events/controllers.
   */
  static async evaluateEvent({ partner_id, order_id, event_type, data = {} }) {
    try {
      if (!partner_id) return null;

      const rules = await FraudModel.getRules();
      const activeRulesMap = new Map(rules.filter(r => r.enabled).map(r => [r.rule_type, r]));

      let detectedFraud = null;

      switch (event_type) {
        case 'GPS_UPDATE':
          detectedFraud = await this._evaluateGpsData(partner_id, order_id, data, activeRulesMap);
          break;
        case 'OTP_VERIFICATION':
          detectedFraud = await this._evaluateOtpVerification(partner_id, order_id, data, activeRulesMap);
          break;
        case 'ORDER_COMPLETION':
          detectedFraud = await this._evaluateOrderCompletion(partner_id, order_id, data, activeRulesMap);
          break;
        case 'WALLET_WITHDRAWAL':
          detectedFraud = await this._evaluateWalletWithdrawal(partner_id, data, activeRulesMap);
          break;
        case 'ZONE_EXIT':
          detectedFraud = await this._evaluateZoneExit(partner_id, data, activeRulesMap);
          break;
        case 'DEVICE_LOGIN':
          detectedFraud = await this._evaluateDeviceLogin(partner_id, data, activeRulesMap);
          break;
        default:
          break;
      }

      if (!detectedFraud) return null;

      // Calculate total cumulative score to determine auto actions
      const newCase = await FraudModel.createCase({
        partner_id,
        order_id: order_id || null,
        fraud_type: detectedFraud.fraud_type,
        risk_score: detectedFraud.risk_score,
        severity: detectedFraud.severity,
        reason: detectedFraud.reason,
        gps_data: data.gps || {},
        device_data: data.device || {},
        status: detectedFraud.severity === 'Critical' ? 'suspended' : (detectedFraud.severity === 'High' ? 'blocked' : 'pending')
      });

      await FraudModel.createLog({
        case_id: newCase.id,
        event: `DETECTED_${detectedFraud.fraud_type}`,
        details: { event_type, raw_data: data, rule_applied: detectedFraud }
      });

      // Recalculate partner cumulative risk score
      const totalScore = await FraudModel.getPartnerCurrentRiskScore(partner_id);

      // Execute auto-actions based on total risk score / severity
      await this._executeAutoActions(partner_id, totalScore, newCase);

      return newCase;
    } catch (err) {
      console.error('[FraudDetectionService] evaluateEvent error:', err);
      return null;
    }
  }

  // --- Rule evaluation subroutines ---

  static async _evaluateGpsData(partner_id, order_id, data, rules) {
    const { lat, lng, prev_lat, prev_lng, timestamp, prev_timestamp, is_mock, speed_kph } = data;

    // 1. GPS Spoofing Detection
    if (is_mock || (data.accuracy && data.accuracy > 500)) {
      const rule = rules.get('GPS_SPOOFING');
      if (rule) {
        return {
          fraud_type: 'GPS Spoofing',
          risk_score: rule.threshold,
          severity: rule.threshold >= 60 ? 'High' : 'Medium',
          reason: 'Mock location / fake GPS provider detected'
        };
      }
    }

    // 2. Impossible Speed / Velocity Check
    if (prev_lat != null && prev_lng != null && timestamp && prev_timestamp) {
      const distKm = this._haversineDistance(prev_lat, prev_lng, lat, lng);
      const timeHrs = Math.max(0.0001, (timestamp - prev_timestamp) / (1000 * 3600));
      const calculatedSpeed = distKm / timeHrs; // km/h

      if (calculatedSpeed > 150 || (speed_kph && speed_kph > 150)) {
        const rule = rules.get('IMPOSSIBLE_SPEED');
        if (rule) {
          return {
            fraud_type: 'Impossible Speed',
            risk_score: rule.threshold,
            severity: 'High',
            reason: `Unrealistic speed calculated (${Math.round(calculatedSpeed)} km/h)`
          };
        }
      }

      // 3. Location Jump Anomaly
      if (distKm > 25 && (timestamp - prev_timestamp) < 60000) { // >25km in <1 min
        const rule = rules.get('LOCATION_JUMP');
        if (rule) {
          return {
            fraud_type: 'Location Jump',
            risk_score: rule.threshold,
            severity: 'Medium',
            reason: `Abnormal location jump detected (${distKm.toFixed(1)} km in ${Math.round((timestamp - prev_timestamp)/1000)}s)`
          };
        }
      }
    }

    return null;
  }

  static async _evaluateOtpVerification(partner_id, order_id, data, rules) {
    const { attempts, failed_attempts, is_abuse } = data;

    if (is_abuse || attempts > 5) {
      const rule = rules.get('OTP_ABUSE');
      if (rule) {
        return {
          fraud_type: 'OTP Abuse',
          risk_score: rule.threshold,
          severity: 'High',
          reason: `Excessive OTP verification attempts detected (${attempts} attempts)`
        };
      }
    }

    if (failed_attempts >= 3) {
      const rule = rules.get('FAILED_OTP');
      if (rule) {
        return {
          fraud_type: 'Multiple Failed OTP Attempts',
          risk_score: rule.threshold,
          severity: 'Medium',
          reason: `Multiple consecutive failed OTP entries (${failed_attempts} failures)`
        };
      }
    }

    return null;
  }

  static async _evaluateOrderCompletion(partner_id, order_id, data, rules) {
    const { duration_minutes, distance_km, cancelled_count_today } = data;

    // 1. Abnormal Order Completion Time (<2 mins for non-trivial distance)
    if (duration_minutes != null && duration_minutes < 2 && distance_km > 1) {
      const rule = rules.get('ABNORMAL_COMPLETION_TIME');
      if (rule) {
        return {
          fraud_type: 'Abnormal Order Completion Time',
          risk_score: rule.threshold,
          severity: 'Medium',
          reason: `Order completed impossibly fast (${duration_minutes} min for ${distance_km} km)`
        };
      }
    }

    // 2. Fake Delivery Check (Delivered without being near dropoff location)
    if (data.distance_from_dropoff_meters && data.distance_from_dropoff_meters > 500) {
      const rule = rules.get('FAKE_DELIVERY');
      if (rule) {
        return {
          fraud_type: 'Fake Delivery',
          risk_score: rule.threshold,
          severity: 'High',
          reason: `Order marked delivered ${Math.round(data.distance_from_dropoff_meters)}m away from target dropoff location`
        };
      }
    }

    // 3. Repeated Order Cancellation
    if (cancelled_count_today && cancelled_count_today >= 3) {
      const rule = rules.get('REPEATED_CANCELLATION');
      if (rule) {
        return {
          fraud_type: 'Repeated Order Cancellation',
          risk_score: rule.threshold,
          severity: 'Medium',
          reason: `Partner cancelled ${cancelled_count_today} orders today after pickup/acceptance`
        };
      }
    }

    return null;
  }

  static async _evaluateWalletWithdrawal(partner_id, data, rules) {
    const { amount, frequency_today, new_bank_account } = data;

    if (amount > 10000 || frequency_today > 5 || (new_bank_account && amount > 2000)) {
      const rule = rules.get('SUSPICIOUS_WITHDRAWAL');
      if (rule) {
        return {
          fraud_type: 'Suspicious Wallet Withdrawals',
          risk_score: rule.threshold,
          severity: 'High',
          reason: `High frequency or anomalous withdrawal request (₹${amount}, ${frequency_today} times today)`
        };
      }
    }

    return null;
  }

  static async _evaluateZoneExit(partner_id, data, rules) {
    const { is_outside, zone_name } = data;

    if (is_outside) {
      const rule = rules.get('OUTSIDE_ZONE');
      if (rule) {
        return {
          fraud_type: 'Outside Delivery Zone',
          risk_score: rule.threshold,
          severity: 'Low',
          reason: `Partner operated outside assigned delivery zone (${zone_name || 'Unassigned'})`
        };
      }
    }

    return null;
  }

  static async _evaluateDeviceLogin(partner_id, data, rules) {
    const { device_id, active_devices_count, is_vpn, is_rapid_switch } = data;

    if (is_vpn) {
      const rule = rules.get('VPN_DETECTION');
      if (rule) {
        return {
          fraud_type: 'VPN Detection',
          risk_score: rule.threshold,
          severity: 'Low',
          reason: 'VPN or proxy network detected during partner activity'
        };
      }
    }

    if (is_rapid_switch) {
      const rule = rules.get('RAPID_ACCOUNT_SWITCH');
      if (rule) {
        return {
          fraud_type: 'Rapid Account Switching',
          risk_score: rule.threshold,
          severity: 'Medium',
          reason: 'Frequent account switching detected on single device'
        };
      }
    }

    if (active_devices_count && active_devices_count > 2) {
      const rule = rules.get('MULTIPLE_DEVICE_LOGIN');
      if (rule) {
        return {
          fraud_type: 'Multiple Device Login',
          risk_score: rule.threshold,
          severity: 'Medium',
          reason: `Logged in concurrently across ${active_devices_count} devices`
        };
      }
    }

    return null;
  }

  // --- Auto Actions Matrix ---

  static async _executeAutoActions(partner_id, totalScore, fraudCase) {
    const io = getIO();

    // Broadcast Realtime Admin alert
    if (io) {
      io.to(roleRoom('admin')).emit(EVENTS.ADMIN_FRAUD_NEW, {
        case: fraudCase,
        total_risk_score: totalScore
      });
    }

    // 0 - 30: Low -> Log only
    if (totalScore <= 30) {
      console.log(`[FraudAction] Low risk score (${totalScore}) for partner ${partner_id}. Logged case ${fraudCase.id}`);
      return;
    }

    // 31 - 60: Medium -> Warning Notification
    if (totalScore >= 31 && totalScore <= 60) {
      await notify({
        userId: partner_id,
        type: 'fraud_warning',
        title: '⚠️ Safety & Risk Warning',
        message: `Activity alert: ${fraudCase.reason}. Please adhere to delivery guidelines to avoid account restrictions.`,
        meta: { case_id: fraudCase.id, risk_score: totalScore, link: '/delivery/fraud' }
      });

      if (io) {
        io.to(userRoom(partner_id)).emit(EVENTS.DELIVERY_FRAUD_WARNING, {
          title: 'Safety Warning',
          message: fraudCase.reason,
          risk_score: totalScore
        });
      }
    }

    // 61 - 80: High -> Temporarily block accepting orders
    if (totalScore >= 61 && totalScore <= 80) {
      await pool.query(
        `UPDATE delivery_partners SET is_available = FALSE WHERE user_id = $1`,
        [partner_id]
      );

      await notify({
        userId: partner_id,
        type: 'fraud_blocked',
        title: '⛔ Account Temporarily Blocked',
        message: `Your account is temporarily restricted from accepting orders due to high risk score (${totalScore}). Reason: ${fraudCase.reason}`,
        meta: { case_id: fraudCase.id, risk_score: totalScore, link: '/delivery/fraud' }
      });

      if (io) {
        io.to(userRoom(partner_id)).emit(EVENTS.DELIVERY_FRAUD_BLOCKED, {
          status: 'blocked',
          reason: fraudCase.reason,
          risk_score: totalScore
        });
      }
    }

    // 81 - 100: Critical -> Suspend delivery partner & notify admin
    if (totalScore >= 81) {
      await pool.query(
        `UPDATE delivery_partners SET status = 'suspended', is_available = FALSE WHERE user_id = $1`,
        [partner_id]
      );
      await pool.query(
        `UPDATE users SET is_deleted = TRUE WHERE id = $1 AND role = 'delivery_partner'`,
        [partner_id]
      );

      await notify({
        userId: partner_id,
        type: 'fraud_suspended',
        title: '🚫 Delivery Partner Account Suspended',
        message: `Your account has been suspended due to critical fraud flags (${totalScore}/100). Please contact support.`,
        meta: { case_id: fraudCase.id, risk_score: totalScore, link: '/delivery/fraud' }
      });

      if (io) {
        io.to(userRoom(partner_id)).emit(EVENTS.DELIVERY_FRAUD_BLOCKED, {
          status: 'suspended',
          reason: fraudCase.reason,
          risk_score: totalScore
        });
      }
    }
  }

  // --- Distance helper ---
  static _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = FraudDetectionService;
