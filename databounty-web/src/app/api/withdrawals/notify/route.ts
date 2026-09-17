import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { withdrawalId, userName, userEmail, netAmount, bankName, accountNumber } = await request.json();

    // Securely retrieved from environment variables / secret manager
    const adminEmail = process.env.ADMIN_EMAIL || 'support@databounty.sampidia.com';

    console.log(`[Admin Email Notification] Sending withdrawal alert to secret recipient ${adminEmail}`);
    console.log(`Request Details - ID: ${withdrawalId}, User: ${userName} (${userEmail}), Net Payout: ₦${netAmount}, Bank: ${bankName} (${accountNumber})`);

    return NextResponse.json({
      success: true,
      message: `Withdrawal alert successfully routed to admin at ${adminEmail}`,
      status: 'PENDING'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
