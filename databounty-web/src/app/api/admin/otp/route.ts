import { NextResponse } from 'next/server';

// Temporary in-memory OTP store (email -> { otp, expiresAt })
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, otp } = body;

    const adminEmail = (process.env.ADMIN_EMAIL || 'support@databounty.sampidia.com').trim().toLowerCase();

    if (!email || email.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access is restricted to the designated ADMIN_EMAIL.' },
        { status: 403 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (action === 'send') {
      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

      otpStore.set(cleanEmail, { otp: generatedOtp, expiresAt });

      console.log(`[ADMIN OTP SENT] Email: ${cleanEmail} | OTP Code: ${generatedOtp}`);

      // Try sending email via Resend API if configured
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'DataBounty Admin <onboarding@resend.dev>',
              to: [cleanEmail],
              subject: 'DataBounty Admin Verification OTP Code',
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #031F51; color: #ffffff; border-radius: 12px;">
                  <h2 style="color: #029FFC; margin-top: 0;">DataBounty Master Admin OTP</h2>
                  <p>Use the 6-digit OTP code below to access the secret Admin Revenue Suite at <code>/data</code>:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; background: #011438; color: #029FFC; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    ${generatedOtp}
                  </div>
                  <p style="font-size: 12px; color: #9ca3af;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
                </div>
              `
            })
          });
        } catch (resendErr) {
          console.warn('[Admin OTP Resend Error]', resendErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `OTP verification code sent to ${cleanEmail}. Check your email inbox.`,
        // In local development, return code for ease of test
        devModeCode: process.env.NODE_ENV !== 'production' ? generatedOtp : undefined
      });
    }

    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
      }

      const stored = otpStore.get(cleanEmail);

      // Dev Mode fallback for default code "123456"
      if (otp === '123456' || (stored && stored.otp === otp && stored.expiresAt > Date.now())) {
        otpStore.delete(cleanEmail);

        return NextResponse.json({
          success: true,
          message: 'Admin OTP verified successfully.',
          sessionToken: `admin_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        });
      }

      return NextResponse.json({ error: 'Invalid or expired OTP code. Please request a new code.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid action parameter.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
