import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { submissionId, taskTitle, userName, userEmail, rejectionReason } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL || 'support@databounty.sampidia.com';
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || 'DataBounty <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.warn('[Resend API Warning] RESEND_API_KEY environment variable is not set. Log fallback:');
      console.log(`[Submission Rejected] ID: ${submissionId}, Task: ${taskTitle}, Tester: ${userName} (${userEmail}), Reason: ${rejectionReason}`);
      return NextResponse.json({
        success: true,
        message: 'Rejection logged (RESEND_API_KEY not set).'
      });
    }

    const emailHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    };

    // 1. Send Email to Tester
    const testerSubject = `Submission Update: ${taskTitle}`;
    const testerHtml = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #011438; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.3);">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #f87171; margin: 0; font-size: 20px;">DataBounty Submission Notice</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Task: ${taskTitle}</p>
        </div>

        <p style="font-size: 14px; color: #e2e8f0;">Hello <strong>${userName || 'Tester'}</strong>,</p>
        <p style="font-size: 14px; color: #e2e8f0;">Your proof submission for <strong>${taskTitle}</strong> was reviewed by the creator and could not be approved at this time.</p>

        <div style="background-color: #031F51; padding: 16px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2); margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0; text-transform: uppercase; font-weight: bold;">Reason for Rejection:</p>
          <p style="font-size: 15px; color: #f87171; margin: 0; font-weight: 600;">${rejectionReason || 'Proof does not satisfy task requirements.'}</p>
        </div>

        <p style="font-size: 13px; color: #94a3b8;">If you believe this was in error, please contact support at ${adminEmail}.</p>
      </div>
    `;

    if (userEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: emailHeaders,
        body: JSON.stringify({
          from,
          to: [userEmail],
          subject: testerSubject,
          html: testerHtml,
        }),
      });
    }

    // 2. Send Email to Admin
    const adminSubject = `[Admin Alert] Submission Rejected: ${taskTitle}`;
    const adminHtml = `
      <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #011438; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid rgba(2, 91, 229, 0.3);">
        <div style="border-bottom: 2px solid #025BE5; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #029FFC; margin: 0; font-size: 20px;">DataBounty Admin Alert</h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Submission Rejection Registered</p>
        </div>

        <div style="background-color: #031F51; padding: 20px; border-radius: 12px; border: 1px solid rgba(2, 159, 252, 0.2);">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
            <tr><td style="padding: 6px 0; color: #94a3b8;">Submission ID:</td><td style="padding: 6px 0; font-weight: bold; color: #029FFC;">${submissionId}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Task Title:</td><td style="padding: 6px 0; font-weight: bold;">${taskTitle}</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Tester:</td><td style="padding: 6px 0;">${userName} (${userEmail || 'N/A'})</td></tr>
            <tr><td style="padding: 6px 0; color: #94a3b8;">Reason:</td><td style="padding: 6px 0; color: #f87171;">${rejectionReason}</td></tr>
          </table>
        </div>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: emailHeaders,
      body: JSON.stringify({
        from,
        to: [adminEmail],
        subject: adminSubject,
        html: adminHtml,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Rejection emails dispatched successfully.'
    });
  } catch (err: any) {
    console.error('[Rejection Email Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
