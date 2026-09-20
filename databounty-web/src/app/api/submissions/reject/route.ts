import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`submission_reject:${ip}`, { limit: 20, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { submissionId, rejectionReason, idToken } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });
    }

    const subRef = adminDb.collection('submissions').doc(submissionId);
    const subSnap = await subRef.get();

    if (!subSnap.exists) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const subData = subSnap.data()!;
    const taskId = subData.taskId;
    const previousStatus = subData.status;

    // Verify creator authorization if idToken is supplied
    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const taskSnap = taskId ? await adminDb.collection('tasks').doc(taskId).get() : null;
        const creatorId = taskSnap?.exists ? taskSnap.data()?.creatorId : subData.creatorId;

        if (creatorId && decodedToken.uid !== creatorId) {
          return NextResponse.json({ error: 'Only the task creator can reject submissions.' }, { status: 403 });
        }
      } catch (authErr) {
        console.warn('[Submission Reject API] Token verification warning:', authErr);
      }
    }

    const cleanReason = (rejectionReason || 'Submission proof did not meet required criteria.').trim();

    // 1. Mark submission as rejected
    await subRef.update({
      status: 'rejected',
      rejectionReason: cleanReason,
      verifiedAt: new Date().toISOString()
    });

    // 2. Update task spots & reactivate status if previously approved or completed
    if (taskId) {
      const taskRef = adminDb.collection('tasks').doc(taskId);
      const taskSnap = await taskRef.get();

      if (taskSnap.exists) {
        const tData = taskSnap.data()!;
        const updates: Record<string, any> = {};

        // If it was previously approved, decrement completedSpots
        if (previousStatus === 'approved' && (tData.completedSpots || 0) > 0) {
          updates.completedSpots = FieldValue.increment(-1);
        }

        // Always ensure task status is reset to 'active' if it's currently completed or has open capacity
        const currentCompleted = Math.max(0, (tData.completedSpots || 0) - (previousStatus === 'approved' ? 1 : 0));
        if (currentCompleted < (tData.totalSpots || 1) && tData.status === 'completed') {
          updates.status = 'active';
        }

        if (Object.keys(updates).length > 0) {
          await taskRef.update(updates);
        }
      }
    }

    // 3. Send notification email asynchronously
    if (subData.userEmail) {
      fetch(`${new URL(request.url).origin}/api/email/rejection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          taskTitle: subData.taskTitle || 'Bounty Campaign',
          userName: subData.userName || 'Tester',
          userEmail: subData.userEmail,
          rejectionReason: cleanReason,
        }),
      }).catch((eErr) => console.warn('[Submission Reject API] Email dispatch error:', eErr));
    }

    return NextResponse.json({
      success: true,
      message: 'Submission rejected successfully.'
    });
  } catch (err: any) {
    console.error('[Submission Reject API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
