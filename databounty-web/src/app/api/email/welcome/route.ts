import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`email_welcome:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  try {
    const { email, name, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || 'DataBounty <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.warn('[Resend API Warning] RESEND_API_KEY environment variable is not set.');
      console.log(`[Welcome Email Log Fallback] Email: ${email}, Name: ${name}, Role: ${role}`);
      return NextResponse.json({
        success: true,
        message: 'Welcome email logged (RESEND_API_KEY not set).'
      });
    }

    const isCreator = role === 'creator';
    const subject = isCreator
      ? `Welcome to DataBounty — Launch Your First Campaign!`
      : `Welcome to DataBounty — Start Earning Today!`;

    const html = `
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

          <!-- Logo Header -->
          <tr>
            <td style="padding:32px 40px 20px;text-align:center;border-bottom:1px solid rgba(2,91,229,0.2);">
              <img src="https://databounty.sampidia.com/Databounty_logo-old2.webp" alt="DataBounty Logo" width="240" style="width:240px;max-width:100%;height:auto;display:inline-block;border:0;" />
              <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">Nigeria's Premier Micro-Tasking & QA Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 16px;line-height:1.3;">Welcome, ${name || 'User'}! 🎉</h2>
              ${
                isCreator
                  ? `<p style="color:#cbd5e1;font-size:14px;line-height:1.75;margin:0 0 20px;">
                      Thank you for joining as a <strong>Campaign Creator</strong>! You can now publish bounty campaigns for Google Form surveys, Mobile App testing, or Web bug reports with custom demographic targeting.
                    </p>
                    <div style="background-color:#011438;padding:20px;border-radius:12px;border:1px solid rgba(2,159,252,0.2);margin-bottom:20px;">
                      <h4 style="color:#029FFC;margin:0 0 10px 0;font-size:15px;">Get Started in 3 Simple Steps:</h4>
                      <ol style="margin:0;padding-left:20px;font-size:13px;color:#e2e8f0;line-height:1.8;">
                        <li>Go to your <strong>Creator Dashboard</strong>.</li>
                        <li>Click <strong>Publish New Bounty Task</strong> and set your reward & demographic targets.</li>
                        <li>Fund your campaign escrow and start receiving verified tester responses!</li>
                      </ol>
                    </div>`
                  : `<p style="color:#cbd5e1;font-size:14px;line-height:1.75;margin:0 0 20px;">
                      Thank you for joining as a <strong>Bounty Tester</strong>! You are now ready to earn Naira by completing micro-tasks, surveys, app tests, and bug reports.
                    </p>
                    <div style="background-color:#011438;padding:20px;border-radius:12px;border:1px solid rgba(2,159,252,0.2);margin-bottom:20px;">
                      <h4 style="color:#029FFC;margin:0 0 10px 0;font-size:15px;">How to Start Earning:</h4>
                      <ol style="margin:0;padding-left:20px;font-size:13px;color:#e2e8f0;line-height:1.8;">
                        <li>Browse active tasks on the <strong>Tester Task Feed</strong>.</li>
                        <li>Complete tasks matching your demographic profile.</li>
                        <li>Get rewards credited directly to your wallet and cash out to your Nigerian bank account!</li>
                      </ol>
                    </div>`
              }
              <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
                If you have any questions or need assistance, feel free to contact support at <a href="mailto:support@databounty.sampidia.com" style="color:#029FFC;text-decoration:none;">support@databounty.sampidia.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;text-align:center;border-top:1px solid rgba(2,91,229,0.2);">
              <p style="color:#64748b;font-size:11px;margin:0;">
                DataBounty &bull; <a href="https://databounty.sampidia.com" style="color:#029FFC;text-decoration:none;">databounty.sampidia.com</a>
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

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome email dispatched successfully.'
    });
  } catch (err: any) {
    console.error('[Welcome Email Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
