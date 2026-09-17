import { NextResponse } from 'next/server';
import { findBankByTag } from '@/lib/banks';

export async function POST(request: Request) {
  try {
    const { pendingWithdrawals } = await request.json();

    if (!pendingWithdrawals || !Array.isArray(pendingWithdrawals) || pendingWithdrawals.length === 0) {
      return NextResponse.json({ error: 'No pending withdrawal requests to export.' }, { status: 400 });
    }

    // Build CSV content according to ngn_amount_disburse_sample.csv format:
    // "Account Number","Bank","Amount","Narration"
    const csvHeader = '"Account Number","Bank","Amount","Narration"';
    const csvRows = pendingWithdrawals.map((item: any) => {
      const bankTag = item.bankTag || findBankByTag(item.bankName || 'Opay').tag;
      const amount = item.netAmount || item.amount;
      const narration = `transfer to ${item.userName || 'Tester'}`;
      
      return `"${item.accountNumber}","${bankTag}","${amount}","${narration}"`;
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const base64Csv = Buffer.from(csvContent).toString('base64');

    const adminEmail = process.env.ADMIN_EMAIL || 'support@databounty.sampidia.com';
    const resendApiKey = process.env.RESEND_API_KEY;

    let emailSent = false;
    let emailMessage = 'CSV generated successfully.';

    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'DataBounty <onboarding@resend.dev>',
            to: [adminEmail],
            subject: `📊 Disbursement CSV Export (${pendingWithdrawals.length} Pending Withdrawals)`,
            html: `
              <div style="font-family: sans-serif; background-color: #011438; color: #ffffff; padding: 24px; border-radius: 12px;">
                <h2 style="color: #029FFC; margin-top: 0;">DataBounty Pending Withdrawals Disbursement CSV</h2>
                <p style="color: #cbd5e1;">Attached is the generated CSV batch disbursement file for <strong>${pendingWithdrawals.length} pending tester cashouts</strong>.</p>
                <div style="background-color: #031F51; padding: 16px; border-radius: 8px; border: 1px solid #025BE5;">
                  <p style="margin: 0; font-size: 14px;">Total Items: <strong>${pendingWithdrawals.length}</strong></p>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #10b981;">Total Net Disbursement: <strong>₦${pendingWithdrawals.reduce((sum: number, w: any) => sum + (w.netAmount || 0), 0).toLocaleString()}</strong></p>
                </div>
              </div>
            `,
            attachments: [
              {
                filename: `ngn_amount_disburse_${Date.now()}.csv`,
                content: base64Csv,
              },
            ],
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          emailMessage = `CSV generated and emailed as attachment to ${adminEmail}`;
        }
      } catch (e) {
        console.error('[Resend CSV Email Error]', e);
      }
    }

    return NextResponse.json({
      success: true,
      count: pendingWithdrawals.length,
      csvContent,
      emailSent,
      message: emailMessage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
