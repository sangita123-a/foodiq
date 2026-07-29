const path = require('path');
const backendDir = path.join(__dirname, '../foodiq-frontend/foodiq-backend');
const nodemailer = require(path.join(backendDir, 'node_modules/nodemailer'));
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });

const getSmtpHost = () =>
  process.env.SMTP_HOST ||
  process.env.EMAIL_HOST ||
  ((process.env.EMAIL_USER || process.env.SMTP_USER || '').includes('gmail.com') ? 'smtp.gmail.com' : undefined);

const getSmtpPort = () => Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 465);

const getSmtpUser = () => process.env.SMTP_USER || process.env.EMAIL_USER;

const getSmtpPass = () => process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

const getSmtpSecure = () =>
  process.env.SMTP_SECURE !== undefined
    ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
    : getSmtpPort() === 465;

const getFromAddress = () =>
  process.env.EMAIL_FROM ||
  process.env.EMAIL_FROM_ADDRESS ||
  getSmtpUser() ||
  'Foodiq <noreply@foodiq.com>';

async function verifySmtp() {
  console.log("==========================================");
  console.log("SMTP Configuration Verification Diagnostic");
  console.log("==========================================");

  const host = getSmtpHost();
  const port = getSmtpPort();
  const user = getSmtpUser();
  const pass = getSmtpPass();
  const secure = getSmtpSecure();
  const from = getFromAddress();

  console.log(`SMTP_HOST     : ${host || '(NOT SET)'}`);
  console.log(`SMTP_PORT     : ${port}`);
  console.log(`SMTP_SECURE   : ${secure}`);
  console.log(`EMAIL_USER    : ${user || '(NOT SET)'}`);
  console.log(`EMAIL_PASSWORD: ${pass ? '******** (Length: ' + pass.length + ')' : '(NOT SET)'}`);
  console.log(`EMAIL_FROM    : ${from}`);
  console.log("==========================================");

  if (!host || !user || !pass) {
    console.error("❌ Missing required SMTP environment variables!");
    console.error("Required env vars: SMTP_HOST (or EMAIL_USER with @gmail.com), EMAIL_USER (or SMTP_USER), and EMAIL_PASSWORD (or SMTP_PASS)");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  console.log("\n1. Testing SMTP Connection & Authentication (transporter.verify())...");
  try {
    const verified = await transporter.verify();
    console.log("✅ SMTP Connection and Authentication SUCCESSFUL!", verified);
  } catch (err) {
    console.error("❌ SMTP Verification FAILED!");
    console.error("Error Code   :", err.code);
    console.error("Error Command:", err.command);
    console.error("Error Response:", err.response);
    console.error("Error Message :", err.message);
    if (err.message.includes('Invalid login') || err.code === 'EAUTH') {
      console.error("\n💡 Gmail Tip: Make sure to use a 16-character Gmail App Password (generated at https://myaccount.google.com/apppasswords), NOT your main Google account password.");
    }
    return false;
  }

  const targetRecipient = process.argv[2] || user;
  console.log(`\n2. Sending test OTP email to: ${targetRecipient}...`);
  try {
    const info = await transporter.sendMail({
      from,
      to: targetRecipient,
      subject: '[Foodiq] SMTP Test & Password Reset OTP Verification',
      text: 'Your Foodiq test OTP is 123456. If you received this email, SMTP delivery is working perfectly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #ff5722; margin-top: 0;">Foodiq Password Reset</h2>
          <p>Your password reset OTP is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background: #f4f4f4; padding: 10px 20px; display: inline-block; border-radius: 8px;">123456</div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">This email confirms that Nodemailer SMTP email delivery is operational.</p>
        </div>
      `
    });
    console.log("✅ Email Sent Successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Accepted  :", info.accepted);
    return true;
  } catch (err) {
    console.error("❌ Send Mail FAILED!");
    console.error("Error Code   :", err.code);
    console.error("Error Response:", err.response);
    console.error("Error Message :", err.message);
    return false;
  }
}

verifySmtp().catch(console.error);
