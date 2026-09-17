import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || accountNumber.length !== 10) {
      return NextResponse.json({ error: 'Invalid 10-digit NUBAN account number' }, { status: 400 });
    }

    // Simulated Paystack NUBAN API response
    return NextResponse.json({
      success: true,
      accountNumber,
      accountName: 'AMINA BELLO',
      bankName: 'Guaranty Trust Bank (GTBank)',
      message: 'Account NUBAN successfully verified via Paystack API'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
