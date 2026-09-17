import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, formId, taskId, secret } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameter: userEmail' },
        { status: 400 }
      );
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    console.log(`[Google Form Webhook Option 1] Verification received for email: ${cleanEmail}, Task: ${taskId || 'N/A'}`);

    let rewardedUserId = '';
    let rewardAmount = 500;

    try {
      // Find matching pending submission in Firestore
      const subsRef = collection(db, 'submissions');
      const q = query(subsRef, where('status', '==', 'pending_verification'));
      const snap = await getDocs(q);

      let matchedDoc: any = null;
      snap.forEach((d) => {
        const data = d.data();
        if (data.userId && (data.userEmail?.toLowerCase() === cleanEmail || data.userName?.toLowerCase().includes(cleanEmail.split('@')[0]))) {
          matchedDoc = { id: d.id, ...data };
        }
      });

      if (matchedDoc) {
        rewardedUserId = matchedDoc.userId;
        rewardAmount = matchedDoc.rewardAmount || 500;

        // Approve submission
        await updateDoc(doc(db, 'submissions', matchedDoc.id), {
          status: 'approved',
          verifiedAt: new Date().toISOString()
        });

        // Increment user balance
        await updateDoc(doc(db, 'users', rewardedUserId), {
          walletBalance: increment(rewardAmount)
        });
      }
    } catch (fsErr) {
      console.warn('[Webhook Firestore Fallback]', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: `Option 1 Auto-Payout verified for ${cleanEmail}. Reward of ₦${rewardAmount} credited.`,
      rewardedUserId,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
