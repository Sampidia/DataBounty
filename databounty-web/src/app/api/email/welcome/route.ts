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
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #011438; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid rgba(2, 91, 229, 0.3);">
        <div style="border-bottom: 2px solid #025BE5; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #029FFC; margin: 0; font-size: 22px;">Welcome to DataBounty! 🎉</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Nigeria's Premier Micro-Tasking & QA Platform</p>
        </div>

        <p style="font-size: 15px; color: #e2e8f0;">Hello <strong>${name || 'User'}</strong>,</p>

        ${
          isCreator
            ? `<p style="font-size: 14px; color: #cbd5e1; leading-relaxed: true;">
                Thank you for joining DataBounty as a <strong>Campaign Creator</strong>! You can now publish bounty campaigns for Google Form surveys, Mobile App testing, or Web bug reports with custom demographic targeting.
              </p>
              <div style="background-color: #031F51; padding: 16px; border-radius: 12px; border: 1px solid rgba(2, 159, 252, 0.2); margin: 20px 0;">
                <h4 style="color: #029FFC; margin: 0 0 8px 0;">Get Started in 3 Simple Steps:</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #e2e8f0;">
                  <li style="margin-bottom: 6px;">Go to your <strong>Creator Dashboard</strong>.</li>
                  <li style="margin-bottom: 6px;">Click <strong>Publish New Bounty Task</strong> and set your reward & demographic targets.</li>
                  <li>Fund your campaign escrow and start receiving verified tester responses!</li>
                </ol>
              </div>`
            : `<p style="font-size: 14px; color: #cbd5e1; leading-relaxed: true;">
                Thank you for joining DataBounty as a <strong>Bounty Tester</strong>! You are now ready to earn Naira by completing micro-tasks, surveys, app tests, and bug reports.
              </p>
              <div style="background-color: #031F51; padding: 16px; border-radius: 12px; border: 1px solid rgba(2, 159, 252, 0.2); margin: 20px 0;">
                <h4 style="color: #029FFC; margin: 0 0 8px 0;">How to Start Earning:</h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #e2e8f0;">
                  <li style="margin-bottom: 6px;">Browse active tasks on the <strong>Tester Task Feed</strong>.</li>
                  <li style="margin-bottom: 6px;">Complete tasks matching your demographic profile.</li>
                  <li>Get rewards credited directly to your wallet and cash out to your Nigerian bank account!</li>
                </ol>
              </div>`
        }

        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
          If you have any questions, feel free to reply to this email or contact support.
        </p>
      </div>
    `;

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
