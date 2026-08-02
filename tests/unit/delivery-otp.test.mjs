/**
 * Unit tests for Delivery OTP Generation & Verification Logic
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function generateOtp() {
  const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
  const hash = crypto.createHash("sha256").update(rawOtp).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  return { rawOtp, hash, expiresAt };
}

function verifyOtpHelper({ inputOtp, storedHash, expiresAt, attempts }) {
  if (attempts >= 5) {
    return { valid: false, reason: "max_attempts_exceeded" };
  }
  if (expiresAt && new Date() > new Date(expiresAt)) {
    return { valid: false, reason: "expired" };
  }
  const inputHash = crypto.createHash("sha256").update(String(inputOtp).trim()).digest("hex");
  if (inputHash !== storedHash) {
    return { valid: false, reason: "invalid_otp", attemptsLeft: Math.max(0, 5 - (attempts + 1)) };
  }
  return { valid: true };
}

describe("Delivery OTP Verification Logic", () => {
  it("generates a valid 6-digit random OTP and SHA-256 hash with 15-minute expiry", () => {
    const { rawOtp, hash, expiresAt } = generateOtp();
    assert.equal(/^\d{6}$/.test(rawOtp), true);
    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64);

    const diffMins = (expiresAt.getTime() - Date.now()) / (1000 * 60);
    assert.ok(diffMins >= 14.9 && diffMins <= 15.1);
  });

  it("verifies correct OTP successfully", () => {
    const { rawOtp, hash, expiresAt } = generateOtp();
    const result = verifyOtpHelper({
      inputOtp: rawOtp,
      storedHash: hash,
      expiresAt,
      attempts: 0,
    });
    assert.equal(result.valid, true);
  });

  it("rejects incorrect OTP and tracks remaining attempts", () => {
    const { hash, expiresAt } = generateOtp();
    const result = verifyOtpHelper({
      inputOtp: "000000",
      storedHash: hash,
      expiresAt,
      attempts: 2,
    });
    assert.equal(result.valid, false);
    assert.equal(result.reason, "invalid_otp");
    assert.equal(result.attemptsLeft, 2);
  });

  it("rejects verification when maximum attempts (5) are reached", () => {
    const { rawOtp, hash, expiresAt } = generateOtp();
    const result = verifyOtpHelper({
      inputOtp: rawOtp,
      storedHash: hash,
      expiresAt,
      attempts: 5,
    });
    assert.equal(result.valid, false);
    assert.equal(result.reason, "max_attempts_exceeded");
  });

  it("rejects expired OTPs after 15 minutes", () => {
    const { rawOtp, hash } = generateOtp();
    const pastExpiry = new Date(Date.now() - 1000);
    const result = verifyOtpHelper({
      inputOtp: rawOtp,
      storedHash: hash,
      expiresAt: pastExpiry,
      attempts: 0,
    });
    assert.equal(result.valid, false);
    assert.equal(result.reason, "expired");
  });
});
