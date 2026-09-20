import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_withdrawal_list:${ip}`, { limit: 100, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      try {
        await adminAuth.verifyIdToken(idToken);
      } catch (authErr) {
        console.warn('[Admin Withdrawal List API] Token verification warning:', authErr);
      }
    }

    const snap = await adminDb.collection('withdrawals').get();
    const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by requestedAt descending
    loaded.sort((a: any, b: any) => {
      const timeA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
      const timeB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      withdrawals: loaded
    });
  } catch (err: any) {
    console.error('[Admin Withdrawal List API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
