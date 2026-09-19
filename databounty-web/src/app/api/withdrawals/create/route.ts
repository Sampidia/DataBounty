import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`withdrawal_create:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many withdrawal requests. Please wait a minute.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const wd = body.withdrawal || body;
    const idToken = body.idToken;

    if (!wd.userId || !wd.amount || wd.amount < 100) {
      return NextResponse.json({ error: 'Invalid withdrawal parameters' }, { status: 400 });
    }

    // Verify ownership via ID Token
    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.uid !== wd.userId) {
          return NextResponse.json({ error: 'Unauthorized user token' }, { status: 403 });
        }
      } catch (authErr) {
        console.warn('[Withdrawal API] ID token verification warning:', authErr);
      }
    }

    // Check user balance first
    const userSnap = await adminDb.collection('users').doc(wd.userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const currentBalance = userSnap.data()?.walletBalance || 0;
    if (currentBalance < wd.amount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // 1. Save withdrawal document
    const wdId = wd.id || `wd_${Date.now()}`;
    await adminDb.collection('withdrawals').doc(wdId).set({
      ...wd,
      id: wdId,
      status: 'PENDING',
      requestedAt: wd.requestedAt || new Date().toISOString()
    });

    // 2. Debit wallet balance
    await adminDb.collection('users').doc(wd.userId).update({
      walletBalance: FieldValue.increment(-wd.amount)
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request created and wallet debited.',
      withdrawalId: wdId
    });
  } catch (err: any) {
    console.error('[Withdrawal Create API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
