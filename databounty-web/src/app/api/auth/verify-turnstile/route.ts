import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// Cloudflare official test secret key (passes for any token in dev mode if env not set)
const DEFAULT_TEST_SECRET = '1x0000000000000000000000000000000AA';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`verify_turnstile:${ip}`, { limit: 15, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many verification requests. Please wait a minute.' }, { status: 429 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Turnstile token is required.' }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY || DEFAULT_TEST_SECRET;

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await res.json();

    if (data.success) {
      return NextResponse.json({ success: true, message: 'Turnstile verification succeeded.' });
    } else {
      console.warn('[Turnstile Verification Failed]', data);
      return NextResponse.json(
        { error: 'Security verification failed. Please check the captcha and try again.', codes: data['error-codes'] },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('[Turnstile Verification Route Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
