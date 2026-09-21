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

    if (!wd.userId || !wd.amount || wd.amount < 150) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₦150 (₦100 net + ₦50 fee)' }, { status: 400 });
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

    const wdId = wd.id || `wd_${Date.now()}`;
    let newBalance = 0;

    // Execute atomic transaction for balance check, duplicate check, and debit
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection('users').doc(wd.userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error('User profile not found');
      }

      const currentBalance = userSnap.data()?.walletBalance || 0;
      if (currentBalance < wd.amount || currentBalance <= 0) {
        throw new Error(`Insufficient wallet balance. Available: ₦${currentBalance}, Requested: ₦${wd.amount}`);
      }

      const wdRef = adminDb.collection('withdrawals').doc(wdId);
      const wdSnap = await transaction.get(wdRef);
      if (wdSnap.exists) {
        throw new Error('Duplicate withdrawal request detected.');
      }

      newBalance = currentBalance - wd.amount;
      if (newBalance < 0) {
        throw new Error('Insufficient wallet balance');
      }

      // 1. Atomically update wallet balance
      transaction.update(userRef, { walletBalance: newBalance });

      // 2. Atomically save withdrawal document
      transaction.set(wdRef, {
        ...wd,
        id: wdId,
        status: 'PENDING',
        requestedAt: wd.requestedAt || new Date().toISOString()
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request created and wallet debited.',
      withdrawalId: wdId,
      newBalance
    });
  } catch (err: any) {
    console.error('[Withdrawal Create API Error]', err);
    return NextResponse.json({ error: err.message || 'Withdrawal processing failed' }, { status: 400 });
  }
}
