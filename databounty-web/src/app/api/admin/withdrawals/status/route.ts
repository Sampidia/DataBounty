import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_withdrawal_status:${ip}`, { limit: 50, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { withdrawalId, withdrawalIds, status, idToken } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing status parameter.' }, { status: 400 });
    }

    const idsToUpdate: string[] = [];
    if (withdrawalId) {
      idsToUpdate.push(withdrawalId);
    }
    if (Array.isArray(withdrawalIds)) {
      idsToUpdate.push(...withdrawalIds);
    }

    if (idsToUpdate.length === 0) {
      return NextResponse.json({ error: 'No withdrawal ID(s) provided.' }, { status: 400 });
    }

    // Optional admin verification if idToken is supplied
    if (idToken) {
      try {
        await adminAuth.verifyIdToken(idToken);
      } catch (authErr) {
        console.warn('[Admin Withdrawal Status API] Token verification warning:', authErr);
      }
    }

    let updatedCount = 0;

    for (const id of idsToUpdate) {
      const wdRef = adminDb.collection('withdrawals').doc(id);
      const wdSnap = await wdRef.get();

      if (!wdSnap.exists) {
        continue;
      }

      const wdData = wdSnap.data()!;
      const prevStatus = wdData.status;

      // Update status in Firestore
      await wdRef.update({
        status,
        updatedAt: new Date().toISOString()
      });
      updatedCount++;

      // If status changed to REJECTED from non-REJECTED, refund wallet balance
      if (status === 'REJECTED' && prevStatus !== 'REJECTED' && wdData.userId && wdData.amount) {
        await adminDb.collection('users').doc(wdData.userId).set({
          walletBalance: FieldValue.increment(wdData.amount)
        }, { merge: true });
        console.log(`[Admin Withdrawal Status] Refunded ₦${wdData.amount} to user ${wdData.userId} for rejected withdrawal ${id}`);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated ${updatedCount} withdrawal request(s) to status ${status}.`
    });
  } catch (err: any) {
    console.error('[Admin Withdrawal Status API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
