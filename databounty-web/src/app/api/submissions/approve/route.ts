import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`submission_approve:${ip}`, { limit: 20, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { submissionId, userId, rewardAmount, idToken } = await request.json();

    if (!submissionId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const subRef = adminDb.collection('submissions').doc(submissionId);
    const subSnap = await subRef.get();

    if (!subSnap.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const subData = subSnap.data()!;
    const taskId = subData.taskId;

    // Verify creator authorization if idToken is supplied
    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const taskSnap = taskId ? await adminDb.collection('tasks').doc(taskId).get() : null;
        const creatorId = taskSnap?.exists ? taskSnap.data()?.creatorId : subData.creatorId;

        if (creatorId && decodedToken.uid !== creatorId) {
          return NextResponse.json({ error: 'Only the task creator can approve submissions.' }, { status: 403 });
        }
      } catch (authErr) {
        console.warn('[Submission Approve API] Token verification warning:', authErr);
      }
    }

    // 1. Approve submission
    await subRef.update({
      status: 'approved',
      verifiedAt: new Date().toISOString()
    });

    // 2. Credit tester wallet
    const actualReward = rewardAmount || subData.rewardAmount || 0;
    await adminDb.collection('users').doc(userId).set({
      walletBalance: FieldValue.increment(actualReward)
    }, { merge: true });

    // 3. Update task completed spots
    if (taskId) {
      const taskRef = adminDb.collection('tasks').doc(taskId);
      const taskSnap = await taskRef.get();
      if (taskSnap.exists) {
        const tData = taskSnap.data()!;
        const newCompleted = (tData.completedSpots || 0) + 1;
        const updates: Record<string, any> = {
          completedSpots: FieldValue.increment(1)
        };
        if (newCompleted >= (tData.totalSpots || 1)) {
          updates.status = 'completed';
        }
        await taskRef.update(updates);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Submission approved and ₦${actualReward} credited to user.`
    });
  } catch (err: any) {
    console.error('[Submission Approve API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
