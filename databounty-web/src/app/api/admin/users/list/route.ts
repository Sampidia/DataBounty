import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_users_list:${ip}`, { limit: 60, windowMs: 60000 });
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
        console.warn('[Admin Users List API] Token verification warning:', authErr);
      }
    }

    const snap = await adminDb.collection('users').get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by createdAt or name descending
    users.sort((a: any, b: any) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error('[Admin Users List API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
