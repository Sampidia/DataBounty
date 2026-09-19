import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`webhook_google_form:${ip}`, { limit: 20, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many webhook requests.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    let userEmail = body.userEmail || body.email;
    const { formId, taskId, secret } = body;

    // Secret validation when taskId is provided
    if (taskId) {
      const taskSnap = await adminDb.collection('tasks').doc(taskId).get();
      if (!taskSnap.exists) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      const taskData = taskSnap.data();
      if (taskData?.webhookSecret && secret !== taskData.webhookSecret) {
        console.warn(`[Webhook] Rejected: invalid secret for task ${taskId}`);
        return NextResponse.json({ error: 'Unauthorized webhook secret' }, { status: 401 });
      }
    }

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
      console.warn('[Google Form Webhook] Webhook rejected: missing userEmail in payload:', body);
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
      // Find matching pending submission in Firestore using Admin SDK
      const subsSnap = await adminDb
        .collection('submissions')
        .where('status', 'in', ['pending_verification', 'pending'])
        .get();

      for (const d of subsSnap.docs) {
        const data = d.data();
        let emailMatch = false;

        const subEmail = (data.userEmail || '').trim().toLowerCase();
        if (subEmail && subEmail === cleanEmail) {
          emailMatch = true;
        } else if (data.userId) {
          try {
            const userSnap = await adminDb.collection('users').doc(data.userId).get();
            if (userSnap.exists) {
              const profileEmail = (userSnap.data()?.email || '').trim().toLowerCase();
              if (profileEmail && profileEmail === cleanEmail) {
                emailMatch = true;
              }
            }
          } catch (uErr) {
            console.warn(`[Webhook Profile Lookup Warning] Could not fetch user ${data.userId}:`, uErr);
          }
        }

        const taskMatch = taskId ? data.taskId === taskId : true;

        if (data.userId && emailMatch && taskMatch) {
          matchedDoc = { id: d.id, ...data };
          break; // Found matching claim
        }
      }

      if (matchedDoc) {
        rewardedUserId = matchedDoc.userId;
        rewardAmount = matchedDoc.rewardAmount || 500;

        // Approve submission document
        await adminDb.collection('submissions').doc(matchedDoc.id).set({
          status: 'approved',
          verifiedAt: new Date().toISOString()
        }, { merge: true });

        // Increment user wallet balance atomically
        await adminDb.collection('users').doc(rewardedUserId).set({
          walletBalance: FieldValue.increment(rewardAmount)
        }, { merge: true });

        // Update task spots
        if (matchedDoc.taskId) {
          try {
            await adminDb.collection('tasks').doc(matchedDoc.taskId).set({
              completedSpots: FieldValue.increment(1),
              reservedSpots: FieldValue.increment(-1)
            }, { merge: true });
          } catch (tErr) {
            console.warn('[Webhook Task Spot Update Warning]', tErr);
          }
        }
        console.log(`[Google Form Webhook Option 1 SUCCESS] Approved submission ${matchedDoc.id} for user ${rewardedUserId}, credited ₦${rewardAmount}`);
      } else {
        console.log(`[Google Form Webhook Option 1 NOTICE] Received response for ${cleanEmail}, but no active pending submission claim found matching email.`);
      }
    } catch (fsErr) {
      console.error('[Webhook Firestore Processing Error]', fsErr);
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
    console.error('[Google Form Webhook Fatal Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
