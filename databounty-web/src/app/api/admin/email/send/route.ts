import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ALLOWED_FROM_ADDRESSES = [
  'support@databounty.sampidia.com',
  'alerts@databounty.sampidia.com',
];

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_email_send:${ip}`, { limit: 20, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { to, from, subject, message } = body as {
      to: string;
      from: string;
      subject: string;
      message: string;
    };

    if (!to || !from || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, from, subject, message.' },
        { status: 400 }
      );
    }

    // Strict allowlist for from address — security guard
    if (!ALLOWED_FROM_ADDRESSES.includes(from)) {
      return NextResponse.json(
        { error: `Unauthorized sender address. Must be one of: ${ALLOWED_FROM_ADDRESSES.join(', ')}` },
        { status: 403 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('[Admin Email Dispatcher] RESEND_API_KEY not set. Log fallback:');
      console.log(`[Admin Email Dispatcher] To: ${to} | From: ${from} | Subject: ${subject}`);
      return NextResponse.json({
        success: true,
        message: 'Email logged (RESEND_API_KEY not configured).',
      });
    }

    // Modern branded HTML email template
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#010d26;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#010d26;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#031F51;border-radius:16px;overflow:hidden;border:1px solid rgba(2,91,229,0.3);">

          <!-- Header Gradient Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#025BE5,#0379FA,#029FFC);height:5px;"></td>
          </tr>

          <!-- Logo / Brand Header -->
          <tr>
            <td style="padding:32px 40px 20px;text-align:center;border-bottom:1px solid rgba(2,91,229,0.2);">
              <img src="https://databounty.sampidia.com/Databounty_logo-old2.webp" alt="DataBounty Logo" width="240" style="width:240px;max-width:100%;height:auto;display:inline-block;border:0;" />
              <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">Official Communication from DataBounty Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 16px;line-height:1.3;">${subject}</h2>
              <div style="color:#cbd5e1;font-size:14px;line-height:1.75;white-space:pre-line;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(2,91,229,0.2);" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;text-align:center;">
              <p style="color:#64748b;font-size:11px;margin:0 0 6px;">
                This message was sent by DataBounty Admin &bull; <a href="https://databounty.sampidia.com" style="color:#029FFC;text-decoration:none;">databounty.sampidia.com</a>
              </p>
              <p style="color:#64748b;font-size:11px;margin:0;">
                For support, contact <a href="mailto:support@databounty.sampidia.com" style="color:#029FFC;text-decoration:none;">support@databounty.sampidia.com</a>
              </p>
            </td>
          </tr>

          <!-- Bottom Gradient Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#025BE5,#0379FA,#029FFC);height:3px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `DataBounty <${from}>`,
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[Admin Email Dispatcher] Resend API error:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to send email via Resend.' },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${to}.`,
      emailId: data.id,
    });
  } catch (err: any) {
    console.error('[Admin Email Dispatcher Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
