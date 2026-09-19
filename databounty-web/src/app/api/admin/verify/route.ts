import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_verify:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many login attempts. Please wait.' }, { status: 429 });
  }

  try {
    const { password, idToken } = await request.json();

    const expectedPassword = process.env.ADMIN_PASSWORD || 'DataBountyAdmin2026!';

    if (!password || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    if (!idToken) {
      return NextResponse.json({ error: 'User ID token required' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Set custom claim { admin: true } on Firebase user account
    await adminAuth.setCustomUserClaims(uid, { admin: true });

    return NextResponse.json({
      success: true,
      message: 'Admin privileges verified and custom claim set.',
      uid
    });
  } catch (err: any) {
    console.error('[Admin Verify API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
