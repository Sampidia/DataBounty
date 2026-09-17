import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { withdrawalId, userName, userEmail, netAmount, bankName, accountNumber } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL || 'support@databounty.sampidia.com';
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('[Resend API Warning] RESEND_API_KEY environment variable is not set. Falling back to log output.');
      console.log(`[Withdrawal Request] ID: ${withdrawalId}, User: ${userName} (${userEmail}), Net Payout: ₦${netAmount}, Bank: ${bankName} (${accountNumber})`);
      
      return NextResponse.json({
        success: true,
        message: `Withdrawal request registered. Configure RESEND_API_KEY environment variable for live email delivery.`,
        status: 'PENDING'
      });
    }

    // Direct HTTP call to Resend REST API (Zero external npm dependencies needed)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'DataBounty <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🚨 New Withdrawal Request: ₦${netAmount.toLocaleString()} - ${userName}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background-color: #011438; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid rgba(2, 91, 229, 0.3);">
            <div style="border-bottom: 2px solid #025BE5; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #029FFC; margin: 0; font-size: 20px;">DataBounty Admin Alert</h2>
              <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">New Tester Bank Cashout Pending Review</p>
            </div>

            <div style="background-color: #031F51; padding: 20px; border-radius: 12px; border: 1px solid rgba(2, 159, 252, 0.2);">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Withdrawal ID:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #029FFC;">${withdrawalId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Tester Name:</td>
                  <td style="padding: 6px 0; font-weight: bold;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Tester Email:</td>
                  <td style="padding: 6px 0;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Net Payout Amount:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #10b981; font-size: 18px;">₦${netAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Bank Name:</td>
                  <td style="padding: 6px 0; font-weight: bold;">${bankName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">NUBAN Account Number:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 15px; color: #029FFC;">${accountNumber}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 20px; padding: 12px; background-color: rgba(2, 91, 229, 0.15); border-radius: 8px; font-size: 12px; color: #94a3b8;">
              Log in to your <strong>Admin Suite</strong> to process or approve this payout.
            </div>
          </div>
        `,
      }),
    });

    const data = await resendResponse.json();

    return NextResponse.json({
      success: true,
      message: `Withdrawal alert successfully routed to ${adminEmail}`,
      data,
      status: 'PENDING'
    });
  } catch (err: any) {
    console.error('[Resend Fetch Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
