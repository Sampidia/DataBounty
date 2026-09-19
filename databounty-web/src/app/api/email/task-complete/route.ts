import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`email_task_complete:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  try {
    const { taskId, taskTitle, creatorId, creatorEmail, totalSpots } = await request.json();

    if (!creatorEmail) {
      return NextResponse.json({ error: 'creatorEmail is required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || 'DataBounty <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.warn('[Resend API Warning] RESEND_API_KEY environment variable is not set.');
      console.log(`[Task Complete Email Log Fallback] Task ID: ${taskId}, Title: ${taskTitle}, Creator: ${creatorEmail}, Spots: ${totalSpots}`);
      return NextResponse.json({
        success: true,
        message: 'Task complete notification logged (RESEND_API_KEY not set).'
      });
    }

    const subject = `🎉 Campaign Completed: "${taskTitle}"`;
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #011438; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.4);">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #34d399; margin: 0; font-size: 20px;">Campaign Completed! 🎯</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">All target spots filled</p>
        </div>

        <p style="font-size: 15px; color: #e2e8f0;">Great news!</p>
        <p style="font-size: 14px; color: #cbd5e1;">Your bounty campaign <strong>"${taskTitle}"</strong> has successfully reached its capacity of <strong>${totalSpots} completed tester spots</strong>.</p>

        <div style="background-color: #031F51; padding: 16px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3); margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
            <tr><td style="padding: 4px 0; color: #94a3b8;">Task ID:</td><td style="padding: 4px 0; font-weight: bold; color: #029FFC;">${taskId}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Campaign Title:</td><td style="padding: 4px 0; font-weight: bold;">${taskTitle}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Total Completed Spots:</td><td style="padding: 4px 0; font-weight: bold; color: #34d399;">${totalSpots} / ${totalSpots}</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #cbd5e1;">
          You can review all submission proofs and campaign analytics in your <strong>Creator Dashboard</strong>.
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
        to: [creatorEmail],
        subject,
        html,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Task completion email dispatched successfully.'
    });
  } catch (err: any) {
    console.error('[Task Complete Email Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
