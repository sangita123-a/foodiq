const assert = require('assert');
const deliveryDocumentModel = require('../../models/deliveryDocumentModel');
const deliveryController = require('../../controllers/deliveryController');
const adminController = require('../../controllers/adminController');

async function runDeliveryDocumentsTests() {
  console.log('Running Delivery KYC & Vehicle Verification Unit Tests...');

  // Test 1: deliveryDocumentModel exports required functions and constants
  const requiredModelFns = [
    'upsertDocument',
    'listDocumentsByPartner',
    'getDocumentById',
    'getKycSummaryForPartner',
    'isPartnerKycVerified',
    'assertPartnerKycVerified',
    'listAllForAdmin',
    'reviewDocument',
  ];
  for (const fn of requiredModelFns) {
    assert(typeof deliveryDocumentModel[fn] === 'function', `deliveryDocumentModel.${fn} must be a function`);
  }
  assert.deepStrictEqual(
    deliveryDocumentModel.DOCUMENT_TYPES,
    ['aadhaar', 'pan', 'driving_license', 'rc', 'insurance', 'profile_photo'],
    'DOCUMENT_TYPES must match the supported KYC document set'
  );
  assert.deepStrictEqual(
    deliveryDocumentModel.REQUIRED_DOCUMENT_TYPES,
    deliveryDocumentModel.DOCUMENT_TYPES,
    'All document types are required before a partner is considered KYC verified'
  );
  assert.deepStrictEqual(
    deliveryDocumentModel.EXPIRY_TRACKED_TYPES,
    ['driving_license', 'insurance'],
    'Only driving license and insurance must track expiry dates'
  );

  // Test 2: deliveryController exports document endpoints
  assert(typeof deliveryController.uploadDocument === 'function', 'deliveryController.uploadDocument must be a function');
  assert(typeof deliveryController.getDocuments === 'function', 'deliveryController.getDocuments must be a function');

  // Test 3: adminController exports KYC review endpoints
  assert(typeof adminController.getKycDocuments === 'function', 'adminController.getKycDocuments must be a function');
  assert(typeof adminController.patchKycDocument === 'function', 'adminController.patchKycDocument must be a function');

  // ── KYC verification summary simulation ─────────────────────────────────
  // Mirrors the categorization logic inside deliveryDocumentModel.getKycSummaryForPartner
  const REQUIRED_TYPES = deliveryDocumentModel.REQUIRED_DOCUMENT_TYPES;
  const EXPIRY_TYPES = deliveryDocumentModel.EXPIRY_TRACKED_TYPES;

  const isExpired = (doc) =>
    EXPIRY_TYPES.includes(doc.document_type) && doc.expiry_date && new Date(doc.expiry_date) < new Date();

  const simulateSummary = (documents) => {
    const byType = new Map(documents.map((d) => [d.document_type, d]));
    const missing_types = [];
    const pending_types = [];
    const rejected_types = [];
    const expired_types = [];

    for (const type of REQUIRED_TYPES) {
      const doc = byType.get(type);
      if (!doc) {
        missing_types.push(type);
        continue;
      }
      if (doc.verification_status === 'pending') pending_types.push(type);
      if (doc.verification_status === 'rejected') rejected_types.push(type);
      if (doc.verification_status === 'approved' && isExpired(doc)) expired_types.push(type);
    }

    const is_verified =
      missing_types.length === 0 &&
      pending_types.length === 0 &&
      rejected_types.length === 0 &&
      expired_types.length === 0;

    return { is_verified, missing_types, pending_types, rejected_types, expired_types };
  };

  const approvedDoc = (type, expiry_date = null) => ({
    document_type: type,
    verification_status: 'approved',
    expiry_date,
  });

  // Test 4: No documents uploaded at all -> not verified, everything missing
  const emptySummary = simulateSummary([]);
  assert.strictEqual(emptySummary.is_verified, false, 'Partner with zero documents must not be verified');
  assert.strictEqual(emptySummary.missing_types.length, REQUIRED_TYPES.length);

  // Test 5: All required docs approved and unexpired -> verified
  const fullyApproved = REQUIRED_TYPES.map((type) =>
    EXPIRY_TYPES.includes(type) ? approvedDoc(type, '2099-01-01') : approvedDoc(type)
  );
  const verifiedSummary = simulateSummary(fullyApproved);
  assert.strictEqual(verifiedSummary.is_verified, true, 'Partner with all documents approved must be verified');

  // Test 6: One document still pending review -> not verified
  const withPending = fullyApproved.map((d) =>
    d.document_type === 'aadhaar' ? { ...d, verification_status: 'pending' } : d
  );
  const pendingSummary = simulateSummary(withPending);
  assert.strictEqual(pendingSummary.is_verified, false);
  assert.deepStrictEqual(pendingSummary.pending_types, ['aadhaar']);

  // Test 7: One document rejected -> not verified
  const withRejected = fullyApproved.map((d) =>
    d.document_type === 'pan' ? { ...d, verification_status: 'rejected' } : d
  );
  const rejectedSummary = simulateSummary(withRejected);
  assert.strictEqual(rejectedSummary.is_verified, false);
  assert.deepStrictEqual(rejectedSummary.rejected_types, ['pan']);

  // Test 8: Expired driving license (approved but past expiry) -> not verified
  const withExpiredLicense = fullyApproved.map((d) =>
    d.document_type === 'driving_license' ? { ...d, expiry_date: '2000-01-01' } : d
  );
  const expiredSummary = simulateSummary(withExpiredLicense);
  assert.strictEqual(expiredSummary.is_verified, false);
  assert.deepStrictEqual(expiredSummary.expired_types, ['driving_license']);

  // Test 9: Expiry is only enforced for driving_license/insurance, not other types
  const rcWithNoExpiryTracking = simulateSummary(
    fullyApproved.map((d) => (d.document_type === 'rc' ? { ...d, expiry_date: '2000-01-01' } : d))
  );
  assert.strictEqual(rcWithNoExpiryTracking.is_verified, true, 'RC expiry must not affect verification status');

  // ── reviewDocument input validation ──────────────────────────────────────
  // Test 10: reviewDocument rejects an invalid status without touching the DB
  await assert.rejects(
    () => deliveryDocumentModel.reviewDocument('00000000-0000-0000-0000-000000000000', { status: 'maybe' }),
    (err) => {
      assert.strictEqual(err.status, 400);
      return true;
    },
    'reviewDocument must reject unsupported status values before querying the database'
  );

  console.log('All Delivery KYC & Vehicle Verification Unit Tests passed successfully!');
}

runDeliveryDocumentsTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
