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
      if (taskSnap.exists) {
        const taskData = taskSnap.data();
        if (taskData?.webhookSecret && secret && secret !== taskData.webhookSecret) {
          console.warn(`[Webhook] Rejected: invalid secret for task ${taskId}`);
          return NextResponse.json({ error: 'Unauthorized webhook secret' }, { status: 401 });
        }
      }
    }

    // Flexible email extraction fallback for both Google Sheet and Form triggers
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
      // 1. Check for existing pending submission claim (Order A: Claim first -> Submit form second)
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
        // Order A: Approve existing claim
        rewardedUserId = matchedDoc.userId;
        rewardAmount = matchedDoc.rewardAmount || 500;

        await adminDb.collection('submissions').doc(matchedDoc.id).set({
          status: 'approved',
          verifiedAt: new Date().toISOString()
        }, { merge: true });

        await adminDb.collection('users').doc(rewardedUserId).set({
          walletBalance: FieldValue.increment(rewardAmount)
        }, { merge: true });

        // Note: submitTaskProofToFirestore already incremented completedSpots and decremented reservedSpots when claim was registered
        console.log(`[Google Form Webhook Option 1 SUCCESS] Approved pending submission ${matchedDoc.id} for user ${rewardedUserId}, credited ₦${rewardAmount}`);
      } else {
        // 2. Order B: Submit form first -> Claim second (Auto-create approved claim if user exists & spot available)
        console.log(`[Google Form Webhook Option 1] No pending claim found for ${cleanEmail}. Attempting Order B auto-payout...`);

        const usersSnap = await adminDb
          .collection('users')
          .where('email', '==', cleanEmail)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          const userData = userDoc.data();
          rewardedUserId = userDoc.id;

          let taskTitle = 'Google Form Bounty Survey';
          if (taskId) {
            const tSnap = await adminDb.collection('tasks').doc(taskId).get();
            if (tSnap.exists) {
              const tData = tSnap.data()!;
              rewardAmount = tData.rewardPerUser || 200;
              taskTitle = tData.title || taskTitle;

              // Enforce capacity check
              if ((tData.completedSpots || 0) >= (tData.totalSpots || 1)) {
                return NextResponse.json({ error: 'Campaign spots filled' }, { status: 400 });
              }
            }
          }

          // Check if user was already approved for this task to avoid double payout
          const existingApprovedSnap = taskId
            ? await adminDb
                .collection('submissions')
                .where('taskId', '==', taskId)
                .where('userId', '==', rewardedUserId)
                .where('status', '==', 'approved')
                .get()
            : { empty: true };

          if (existingApprovedSnap.empty) {
            const subId = `sub_${Date.now()}`;
            await adminDb.collection('submissions').doc(subId).set({
              id: subId,
              taskId: taskId || '',
              taskTitle,
              userId: rewardedUserId,
              userName: userData.name || cleanEmail.split('@')[0],
              userEmail: cleanEmail,
              userState: userData.state || 'Lagos',
              userGender: userData.gender || 'Female',
              rewardAmount,
              status: 'approved',
              submittedAt: new Date().toISOString(),
              verifiedAt: new Date().toISOString(),
            });

            await adminDb.collection('users').doc(rewardedUserId).set({
              walletBalance: FieldValue.increment(rewardAmount)
            }, { merge: true });

            if (taskId) {
              await adminDb.collection('tasks').doc(taskId).set({
                completedSpots: FieldValue.increment(1),
                reservedSpots: FieldValue.increment(-1)
              }, { merge: true });
            }

            console.log(`[Google Form Webhook Option 1 AUTO-CREDIT SUCCESS] Created & approved submission ${subId} for user ${rewardedUserId}, credited ₦${rewardAmount}`);
          } else {
            console.log(`[Google Form Webhook Option 1 NOTICE] User ${cleanEmail} was already approved for task ${taskId}. Skipping duplicate payout.`);
          }
        } else {
          console.log(`[Google Form Webhook Option 1 NOTICE] Received response for ${cleanEmail}, but no registered DataBounty user found matching email.`);
        }
      }
    } catch (fsErr) {
      console.error('[Webhook Firestore Processing Error]', fsErr);
    }

    return NextResponse.json({
      success: true,
      message: rewardedUserId
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
