import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin_tasks_status:${ip}`, { limit: 30, windowMs: 60000 });
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
        console.warn('[Admin Tasks Status API] Token verification warning:', authErr);
      }
    }

    const body = await request.json();
    const { taskId, status } = body as { taskId: string; status: 'active' | 'completed' | 'paused' | 'suspended' };

    if (!taskId || !['active', 'completed', 'paused', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide taskId and valid status (active | completed | paused | suspended).' },
        { status: 400 }
      );
    }

    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    await taskRef.update({ status });

    return NextResponse.json({
      success: true,
      message: `Task campaign status updated to '${status}' successfully.`,
      taskId,
      status,
    });
  } catch (err: any) {
    console.error('[Admin Tasks Status API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
