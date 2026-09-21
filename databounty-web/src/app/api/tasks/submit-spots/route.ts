import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`task_submit_spots:${ip}`, { limit: 30, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { taskId, isApproved } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
    }

    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const tData = taskSnap.data()!;
    const updates: Record<string, any> = {
      reservedSpots: FieldValue.increment(-1),
    };

    if (isApproved) {
      const newCompleted = (tData.completedSpots || 0) + 1;
      updates.completedSpots = FieldValue.increment(1);

      if (newCompleted >= (tData.totalSpots || 1)) {
        updates.status = 'completed';

        // Send completion email to creator if creatorId exists
        if (tData.creatorId) {
          adminDb.collection('users').doc(tData.creatorId).get().then((creatorSnap) => {
            const creatorEmail = creatorSnap.exists ? creatorSnap.data()?.email : null;
            if (creatorEmail) {
              const origin = new URL(request.url).origin;
              fetch(`${origin}/api/email/task-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId,
                  taskTitle: tData.title || 'Bounty Campaign',
                  creatorId: tData.creatorId,
                  creatorEmail,
                  totalSpots: tData.totalSpots || newCompleted,
                }),
              }).catch((eErr) => console.warn('[Task Submit Spots] Complete email error:', eErr));
            }
          }).catch((cErr) => console.warn('[Task Submit Spots] Creator lookup error:', cErr));
        }
      }
    } else {
      updates.pendingSpots = FieldValue.increment(1);
    }

    await taskRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Task Submit Spots API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
