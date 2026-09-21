import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`task_create:${ip}`, { limit: 20, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { task, isPaidFromWallet, walletDebitAmount, idToken } = await request.json();

    if (!task || !task.id) {
      return NextResponse.json({ error: 'Missing task data' }, { status: 400 });
    }

    // Verify creator authentication if token provided
    let verifiedUid: string | null = null;
    if (idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        verifiedUid = decodedToken.uid;
      } catch (authErr) {
        console.warn('[Task Create API] Token verification warning:', authErr);
      }
    }

    const creatorId = verifiedUid || task.creatorId;

    // 1. Create task document in Firestore using adminDb
    const taskRef = adminDb.collection('tasks').doc(task.id);
    await taskRef.set({
      ...task,
      creatorId,
      createdAt: task.createdAt || new Date().toISOString(),
      completedSpots: 0,
      pendingSpots: 0,
      reservedSpots: 0,
      status: 'active',
    });

    // 2. Update creator balances in user document
    if (creatorId) {
      const userRef = adminDb.collection('users').doc(creatorId);
      const updates: Record<string, any> = {};

      // Increment escrow balance by task total budget
      if (task.totalBudget && task.totalBudget > 0) {
        updates.escrowBalance = FieldValue.increment(task.totalBudget);
      }

      // Debit wallet balance if paid via wallet or split payment
      const debitAmount = walletDebitAmount || (isPaidFromWallet ? (task.totalBudget + (task.creatorFeePaid || 0)) : 0);
      if (debitAmount > 0) {
        updates.walletBalance = FieldValue.increment(-debitAmount);
      }

      if (Object.keys(updates).length > 0) {
        await userRef.set(updates, { merge: true });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Task published successfully.'
    });
  } catch (err: any) {
    console.error('[Task Create API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
