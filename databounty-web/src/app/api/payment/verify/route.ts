import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transactionId, expectedAmount } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!secretKey) {
      // Development / Testing fallback mode when secret key is not set locally
      console.warn('[Flutterwave Verification] FLUTTERWAVE_SECRET_KEY not set in environment. Dev mode auto-confirming transaction:', transactionId);
      return NextResponse.json({
        success: true,
        verified: true,
        amount: expectedAmount || 0,
        currency: 'NGN',
        status: 'successful',
        transactionId,
        isDevFallback: true,
      });
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
