import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`task_reserve:${ip}`, { limit: 30, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const tData = taskSnap.data()!;
    const completedSpots = tData.completedSpots || 0;
    const pendingSpots = tData.pendingSpots || 0;
    const reservedSpots = tData.reservedSpots || 0;
    const totalSpots = tData.totalSpots || 1;
    const takenSpots = completedSpots + pendingSpots + reservedSpots;

    // Double-check capacity server-side before reserving
    if (takenSpots >= totalSpots) {
      return NextResponse.json({ error: 'All spots are currently taken. Please try again later.' }, { status: 409 });
    }

    await taskRef.update({
      reservedSpots: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Task Reserve API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
