import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_users_status:${ip}`, { limit: 30, windowMs: 60000 });
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
        console.warn('[Admin Users Status API] Token verification warning:', authErr);
      }
    }

    const body = await request.json();
    const { userId, status } = body as { userId: string; status: 'active' | 'suspended' };

    if (!userId || !['active', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide userId and status (active | suspended).' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await userRef.update({ status });

    return NextResponse.json({
      success: true,
      message: `User account ${status === 'suspended' ? 'suspended' : 'activated'} successfully.`,
      userId,
      status,
    });
  } catch (err: any) {
    console.error('[Admin Users Status API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
