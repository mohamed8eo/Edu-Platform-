export async function sendOTPEmail(email: string, otp: string, type: string) {
  console.log('[OTP] function called', {
    email,
    type,
    nodeEnv: process.env.NODE_ENV,
    hasResendKey: !!process.env.RESEND_API_KEY,
  });

  const isProd = process.env.NODE_ENV === 'production';

  // =========================
  // Development mode
  // =========================
  if (!isProd) {
    console.log(`\n📧 [DEV OTP] ${type} → ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Valid for 5 minutes\n`);
    return;
  }

  // =========================
  // Production checks
  // =========================
  if (!process.env.RESEND_API_KEY) {
    console.error('[EMAIL] RESEND_API_KEY is missing');
    return;
  }

  console.log('[PROD] importing resend');

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log('[PROD] resend client created');

  const subject =
    type === 'sign-in'
      ? 'Your sign-in code'
      : type === 'email-verification'
        ? 'Verify your email address'
        : 'Reset your password';

  const html = `
    <h2>OTP Test Email</h2>
    <p><strong>${otp}</strong></p>
  `;

  try {
    console.log('[PROD] sending email...');

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject,
      html,
    });

    console.log('[PROD] email sent successfully', result);

    // Keep process alive briefly (Fly.io safety)
    await new Promise((r) => setTimeout(r, 200));

    console.log('[PROD] send completed');
  } catch (error) {
    console.error('[PROD] email failed', error);
  }
}
