import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || accountNumber.trim().length !== 10 || !/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { success: false, error: 'invalid withdrawal details' },
        { status: 400 }
      );
    }

    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (secretKey) {
      const flwResponse = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: bankCode || '100004',
        }),
      });

      const flwData = await flwResponse.json();

      if (flwResponse.ok && flwData.status === 'success' && flwData.data?.account_name) {
        return NextResponse.json({
          success: true,
          accountNumber,
          accountName: flwData.data.account_name,
          bankCode,
          message: 'Account resolved via Flutterwave API',
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'invalid withdrawal details', details: flwData.message || 'Verification failed' },
          { status: 400 }
        );
      }
    }

    // Fallback mode if FLUTTERWAVE_SECRET_KEY is not yet configured in env
    if (accountNumber === '0000000000' || accountNumber === '1111111111') {
      return NextResponse.json(
        { success: false, error: 'invalid withdrawal details' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accountNumber,
      accountName: 'AMINA BELLO',
      bankCode: bankCode || '100004',
      message: 'Account resolved (Development Fallback Mode)',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'invalid withdrawal details', message: err.message },
      { status: 500 }
    );
  }
}
