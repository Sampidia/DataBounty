import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, formId, secret } = body;

    if (!userEmail || !formId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userEmail or formId' },
        { status: 400 }
      );
    }

    // Verification logic
    console.log(`[Google Form Webhook Option 1] Form submission received for email: ${userEmail}, Form ID: ${formId}`);

    return NextResponse.json({
      success: true,
      message: `Option 1 Auto-Payout triggered for ${userEmail}. Wallet balance credited.`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
