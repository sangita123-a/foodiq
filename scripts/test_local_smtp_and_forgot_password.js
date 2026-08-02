const express = require('express');
const { verifySmtp, sendEmail } = require('../foodiq-frontend/foodiq-backend/services/emailService');

async function testSmtpDirect() {
  console.log("==================================================");
  console.log("STEP 1: Testing verifySmtp() in emailService.js...");
  console.log("==================================================");
  try {
    const res = await verifySmtp();
    console.log("✅ verifySmtp SUCCESS:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.log("❌ verifySmtp EXPECTED RESULT (Diagnostic output):");
    console.log("   Code   :", err.code);
    console.log("   Message:", err.message);
    if (err.missing) console.log("   Missing:", err.missing);
  }
}

async function testSendEmailDirect() {
  console.log("\n==================================================");
  console.log("STEP 2: Testing sendEmail() timeout protection...");
  console.log("==================================================");
  try {
    const res = await sendEmail({
      to: 'test@example.com',
      subject: '[Foodiq Diagnostic Test] OTP Delivery Test',
      html: '<p>Testing Nodemailer SMTP email delivery timeout protection</p>'
    });
    console.log("✅ sendEmail SUCCESS:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.log("❌ sendEmail RETURNED EXACT ERROR:");
    console.log("   Code   :", err.code);
    console.log("   Message:", err.message);
  }
}

async function main() {
  await testSmtpDirect();
  await testSendEmailDirect();
}

main().catch(console.error);
