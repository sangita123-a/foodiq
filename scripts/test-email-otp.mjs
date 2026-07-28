/**
 * Test script for Forgot Password OTP & Email delivery flow.
 * Usage:
 *   node scripts/test-email-otp.mjs [email] [baseUrl]
 *
 * Example:
 *   node scripts/test-email-otp.mjs user@example.com http://localhost:4000
 */

const targetEmail = process.argv[2] || `test_otp_${Date.now()}@example.com`;
const baseUrl = (process.argv[3] || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

async function run() {
  console.log("--------------------------------------------------");
  console.log("Testing Forgot Password OTP & Email Service");
  console.log(`Target Email: ${targetEmail}`);
  console.log(`Base URL    : ${baseUrl}`);
  console.log("--------------------------------------------------");

  // Step 1: Register test user if using auto-generated email and testing local
  if (targetEmail.startsWith("test_otp_") && baseUrl.includes("localhost")) {
    console.log("\n1. Creating test user...");
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "OTP Test User",
        email: targetEmail,
        phone: `+919${String(Date.now()).slice(-9)}`,
        password: "Password123!",
      }),
    });
    const regData = await regRes.json().catch(() => ({}));
    console.log(`Register status: ${regRes.status}`, regData);
  }

  // Step 2: Request Forgot Password OTP
  console.log("\n2. Calling POST /api/auth/forgot-password...");
  const fpRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: targetEmail }),
  });
  const fpData = await fpRes.json().catch(() => ({}));
  console.log(`Forgot Password API status: ${fpRes.status}`);
  console.log("Response:", JSON.stringify(fpData, null, 2));

  if (fpRes.ok && fpData.success) {
    console.log("\n✓ Forgot password request succeeded!");
    if (fpData.data?.email_error) {
      console.error(`✗ Email dispatch error reported: ${fpData.data.email_error}`);
    } else {
      console.log("✓ Email request queued/sent without errors.");
    }
    if (fpData.data?.debug_code) {
      console.log(`[Dev Debug Code]: ${fpData.data.debug_code}`);
    }
  } else {
    console.error("✗ Forgot password request failed:", fpData.message || "Unknown error");
    process.exitCode = 1;
  }

  console.log("--------------------------------------------------");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exitCode = 1;
});
