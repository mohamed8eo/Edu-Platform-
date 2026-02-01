export async function sendOTPEmail(email: string, otp: string, type: string) {
  const isProd = process.env.NODE_ENV === 'production';

  // =========================
  // Development mode
  // =========================
  if (!isProd) {
    console.log(`\n📧 [DEV OTP] ${type} → ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Valid for 5 minutes\n`);
    // return;
  }

  // =========================
  // Production safety checks
  // =========================
  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY is missing');
    return;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject =
    type === 'sign-in'
      ? 'Your sign-in code'
      : type === 'email-verification'
        ? 'Verify your email address'
        : 'Reset your password';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6">
      <h2>Your verification code</h2>
      <p>Use the code below to continue:</p>
      <p style="
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 6px;
        margin: 16px 0;
      ">
        ${otp}
      </p>
      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <p>If you didn’t request this code, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error('[EMAIL FAILED]', error);
  }
}
