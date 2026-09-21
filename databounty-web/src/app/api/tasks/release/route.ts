import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`task_release:${ip}`, { limit: 60, windowMs: 60000 });
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
    const currentReserved = tData.reservedSpots || 0;

    // Prevent going below 0
    if (currentReserved <= 0) {
      return NextResponse.json({ success: true, message: 'No reserved spots to release.' });
    }

    await taskRef.update({
      reservedSpots: FieldValue.increment(-1),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Task Release API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
