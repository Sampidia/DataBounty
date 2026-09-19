import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transactionId, expectedAmount } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (!expectedAmount || typeof expectedAmount !== 'number' || expectedAmount <= 0) {
      return NextResponse.json({ error: 'expectedAmount is required for payment verification.' }, { status: 400 });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      console.error('[Flutterwave Verification] CRITICAL: FLUTTERWAVE_SECRET_KEY is not set in environment.');
      return NextResponse.json({ error: 'Payment service misconfigured. Please contact support.' }, { status: 500 });
    }

    // Call Flutterwave REST API to verify transaction
    const flwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const flwData = await flwRes.json();

    if (
      flwData.status === 'success' &&
      flwData.data &&
      flwData.data.status === 'successful' &&
      flwData.data.currency === 'NGN'
    ) {
      const paidAmount = flwData.data.amount;
      if (expectedAmount && paidAmount < expectedAmount) {
        return NextResponse.json(
          { error: `Insufficient payment amount. Expected ₦${expectedAmount}, received ₦${paidAmount}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        verified: true,
        amount: paidAmount,
        currency: flwData.data.currency,
        status: flwData.data.status,
        txRef: flwData.data.tx_ref,
        transactionId,
      });
    } else {
      return NextResponse.json(
        { error: flwData.message || 'Payment verification failed on Flutterwave.' },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('[Flutterwave Verification Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Server error verifying payment' },
      { status: 500 }
    );
  }
}
