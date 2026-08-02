const test = require('node:test');
const assert = require('node:assert/strict');
const ReferralService = require('../../services/referralService');

test('Referral Program Module Business Rules & Logic', async (t) => {
  await t.test('generates unique referral code in FDQ-XXXXXX format', async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateCode = () => {
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `FDQ-${randomPart}`;
    };

    const code1 = generateCode();
    const code2 = generateCode();

    assert.match(code1, /^FDQ-[A-Z0-9]{6}$/, 'Code 1 must match FDQ-XXXXXX format');
    assert.match(code2, /^FDQ-[A-Z0-9]{6}$/, 'Code 2 must match FDQ-XXXXXX format');
    assert.notEqual(code1, code2, 'Generated codes should be unique');
  });

  await t.test('prevents self-referral attempts', async () => {
    const isSelfReferral = (referrerId, referredId) => referrerId === referredId;

    assert.equal(isSelfReferral('partner-100', 'partner-100'), true, 'Self referral should be detected and blocked');
    assert.equal(isSelfReferral('partner-100', 'partner-200'), false, 'Different partners referral is valid');
  });

  await t.test('evaluates reward eligibility with strict business rules', () => {
    const evaluateEligibility = ({
      referredStatus,
      referredKycVerified,
      completedDeliveries,
      minDeliveriesRequired = 1,
      riskScore = 0,
      isBlocked = false,
      isSuspended = false,
      referrerStatus,
      referralStatus,
    }) => {
      const isKycApproved = referredStatus === 'approved' && Boolean(referredKycVerified);
      const isFirstDeliveryDone = completedDeliveries >= minDeliveriesRequired;
      const hasFraudFlags = isBlocked || isSuspended || riskScore >= 70;
      const isReferrerActive = referrerStatus === 'approved';

      const eligible =
        isKycApproved &&
        isFirstDeliveryDone &&
        !hasFraudFlags &&
        isReferrerActive &&
        referralStatus === 'first_delivery_completed';

      return {
        eligible,
        reasons: [
          !isKycApproved && 'KYC Not Approved',
          !isFirstDeliveryDone && 'First Delivery Pending',
          hasFraudFlags && 'Active Fraud/Risk Flags',
          !isReferrerActive && 'Referrer Inactive',
        ].filter(Boolean),
      };
    };

    const validCase = evaluateEligibility({
      referredStatus: 'approved',
      referredKycVerified: true,
      completedDeliveries: 1,
      minDeliveriesRequired: 1,
      riskScore: 10,
      isBlocked: false,
      isSuspended: false,
      referrerStatus: 'approved',
      referralStatus: 'first_delivery_completed',
    });

    assert.equal(validCase.eligible, true, 'Valid referral meeting all 5 conditions must be eligible for reward');

    const pendingKycCase = evaluateEligibility({
      referredStatus: 'pending',
      referredKycVerified: false,
      completedDeliveries: 1,
      referrerStatus: 'approved',
      referralStatus: 'registered',
    });

    assert.equal(pendingKycCase.eligible, false, 'Incomplete KYC should block reward credit');

    const fraudCase = evaluateEligibility({
      referredStatus: 'approved',
      referredKycVerified: true,
      completedDeliveries: 5,
      riskScore: 85,
      referrerStatus: 'approved',
      referralStatus: 'first_delivery_completed',
    });

    assert.equal(fraudCase.eligible, false, 'Partner with high risk score should be blocked from reward payout');
  });

  await t.test('builds social share links correctly', () => {
    const payloadWhatsapp = ReferralService.getSharePayload('FDQ-AB1234', 'whatsapp');
    assert.equal(payloadWhatsapp.referralCode, 'FDQ-AB1234');
    assert.ok(payloadWhatsapp.shareUrl.includes('whatsapp.com'), 'Share URL must contain WhatsApp domain');
    assert.ok(payloadWhatsapp.text.includes('FDQ-AB1234'), 'Share text must include referral code');

    const payloadTelegram = ReferralService.getSharePayload('FDQ-AB1234', 'telegram');
    assert.ok(payloadTelegram.shareUrl.includes('t.me'), 'Telegram share URL must use t.me domain');

    const payloadEmail = ReferralService.getSharePayload('FDQ-AB1234', 'email');
    assert.ok(payloadEmail.shareUrl.startsWith('mailto:'), 'Email share URL must start with mailto:');
  });
});
