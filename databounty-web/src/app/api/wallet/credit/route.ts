import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`wallet_credit:${ip}`, { limit: 10, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { userId, amount, operation, reason, idToken } = await request.json();

    if (!userId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Verify user authorization via Firebase ID token if provided
    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.uid !== userId) {
          return NextResponse.json({ error: 'Unauthorized user token' }, { status: 403 });
        }
      } catch (authErr) {
        console.warn('[Wallet API] ID Token verification failed:', authErr);
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
    }

    const delta = operation === 'debit' ? -amount : amount;

    await adminDb.collection('users').doc(userId).set({
      walletBalance: FieldValue.increment(delta),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: `Wallet ${operation === 'debit' ? 'debited' : 'credited'} by ₦${amount}`,
      userId,
      amount,
      operation
    });
  } catch (err: any) {
    console.error('[Wallet Credit API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
