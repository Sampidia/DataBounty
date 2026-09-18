import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let userEmail = body.userEmail || body.email;
    const { formId, taskId, secret } = body;

    // Flexible email extraction fallback if Apps Script sends e.values or e.namedValues
    if (!userEmail && Array.isArray(body.responses)) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      for (const val of body.responses) {
        if (typeof val === 'string' && emailRegex.test(val)) {
          const match = val.match(emailRegex);
          if (match) {
            userEmail = match[0];
            break;
          }
        }
      }
    }

    if (!userEmail && body.namedValues && typeof body.namedValues === 'object') {
      for (const key of Object.keys(body.namedValues)) {
        if (key.toLowerCase().includes('email')) {
          const val = Array.isArray(body.namedValues[key]) ? body.namedValues[key][0] : body.namedValues[key];
          if (typeof val === 'string' && val.includes('@')) {
            userEmail = val;
            break;
          }
        }
      }
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameter: userEmail or email response' },
        { status: 400 }
      );
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    console.log(`[Google Form Webhook Option 1] Verification received for email: ${cleanEmail}, Task: ${taskId || 'N/A'}`);

    let rewardedUserId = '';
    let rewardAmount = 500;
    let matchedDoc: any = null;

    try {
      // Find matching pending submission in Firestore
      const subsRef = collection(db, 'submissions');
      const q = query(subsRef, where('status', '==', 'pending_verification'));
      const snap = await getDocs(q);

      snap.forEach((d) => {
        const data = d.data();
        if (
          data.userId &&
          (data.userEmail?.toLowerCase() === cleanEmail ||
           data.userName?.toLowerCase().includes(cleanEmail.split('@')[0]) ||
           (taskId && data.taskId === taskId))
        ) {
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
      message: matchedDoc
        ? `Option 1 Auto-Payout verified for ${cleanEmail}. Reward of ₦${rewardAmount} credited.`
        : `Option 1 Webhook received for ${cleanEmail}. Response registered.`,
      rewardedUserId,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
