import { db, auth } from './firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, increment, query, where, orderBy, getDoc 
} from 'firebase/firestore';
import { BountyTask, TaskSubmission, UserProfile, WithdrawalRequest, Transaction } from './types';

// Initial Data Seeds (Fallback for UI loading state)
export const INITIAL_USER: UserProfile = {
  id: 'usr_guest',
  name: 'Guest User',
  email: '',
  phone: '',
  gender: 'Female',
  country: 'Nigeria',
  state: 'Lagos',
  deviceBrand: 'Mobile',
  deviceModel: 'Device',
  osVersion: 'Android 14',
  bankName: 'Opay',
  accountNumber: '0000000000',
  accountName: 'GUEST',
  walletBalance: 0,
  escrowBalance: 0,
  role: 'tester',
  status: 'active',
};

export const INITIAL_CREATOR: UserProfile = {
  id: 'usr_creator',
  name: 'Creator Studio',
  email: '',
  phone: '',
  gender: 'Male',
  country: 'Nigeria',
  state: 'Lagos',
  deviceBrand: 'MacBook',
  deviceModel: 'Pro',
  osVersion: 'macOS',
  bankName: 'Zenith Bank',
  accountNumber: '0000000000',
  accountName: 'CREATOR',
  walletBalance: 0,
  escrowBalance: 0,
  role: 'creator',
  status: 'active',
};

export const INITIAL_TASKS: BountyTask[] = [];

export const INITIAL_SUBMISSIONS: TaskSubmission[] = [];
export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Helper to strip undefined values so Firestore setDoc/updateDoc never fails with unsupported field errors
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

// --- FIRESTORE PERSISTENCE SERVICES ---

export async function fetchTasksFromFirestore(): Promise<BountyTask[]> {
  try {
    const tasksRef = collection(db, 'tasks');
    const snap = await getDocs(tasksRef);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BountyTask));
    }
  } catch (err) {
    console.warn('[Firestore] fetchTasks error fallback:', err);
  }
  return [];
}

export async function createFirestoreTask(
  task: BountyTask,
  isPaidFromWallet: boolean = false,
  walletDebitAmount?: number
): Promise<void> {
  try {
    const cleanTask = sanitizeForFirestore(task);
    const idToken = await auth.currentUser?.getIdToken();

    const res = await fetch('/api/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: cleanTask,
        isPaidFromWallet,
        walletDebitAmount,
        idToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to publish task to database.');
    }
  } catch (err: any) {
    console.error('[Firestore] createFirestoreTask FAILED:', err);
    throw new Error(err?.message || 'Failed to save task to database. Please try again.');
  }
}

export async function submitTaskProofToFirestore(submission: TaskSubmission): Promise<void> {
  try {
    // Check if user already submitted for this task (excluding rejected submissions)
    if (submission.taskId && submission.userId) {
      const existingQuery = query(
        collection(db, 'submissions'),
        where('taskId', '==', submission.taskId),
        where('userId', '==', submission.userId)
      );
      const existingSnap = await getDocs(existingQuery);
      const activeExisting = existingSnap.docs.filter(
        (d) => d.data().status !== 'rejected'
      );
      if (activeExisting.length > 0) {
        const existingApproved = activeExisting.find((d) => d.data().status === 'approved');
        if (existingApproved) {
          throw new Error('ALREADY_VERIFIED_WEBHOOK:Your form response was already verified via Google Form and reward has been credited to your wallet!');
        }
        throw new Error('You have already submitted proof for this task.');
      }
    }

    const cleanSubmission = sanitizeForFirestore(submission);
    const subRef = doc(db, 'submissions', submission.id);
    await setDoc(subRef, cleanSubmission);

    if (submission.taskId) {
      try {
        await fetch('/api/tasks/submit-spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: submission.taskId,
            isApproved: submission.status === 'approved',
          }),
        });
      } catch (spotErr) {
        console.warn('[Task Submit Spots API Call Warning]', spotErr);
      }
    }
  } catch (err: any) {
    console.error('[Firestore] submitTaskProofToFirestore FAILED:', err);
    throw new Error(err?.message || 'Failed to submit proof. Please try again.');
  }
}

export async function reserveTaskSpotInFirestore(taskId: string): Promise<void> {
  try {
    const res = await fetch('/api/tasks/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Reserve failed');
    }
  } catch (err) {
    console.warn('[API] reserveTaskSpot error:', err);
  }
}

export async function releaseTaskSpotInFirestore(taskId: string): Promise<void> {
  try {
    const res = await fetch('/api/tasks/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Release failed');
    }
  } catch (err) {
    console.warn('[API] releaseTaskSpot error:', err);
  }
}

export async function approveSubmissionInFirestore(submissionId: string, userId: string, rewardAmount: number, taskId?: string): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/submissions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId, userId, rewardAmount, idToken }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server approval failed');
    }
  } catch (err: any) {
    console.error('[Firestore] approveSubmissionInFirestore FAILED:', err);
    throw new Error(err?.message || 'Failed to approve submission. Please try again.');
  }
}

export async function requestWithdrawalInFirestore(wd: WithdrawalRequest): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/withdrawals/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawal: wd, idToken }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server withdrawal processing failed');
    }
  } catch (err: any) {
    console.error('[Firestore] requestWithdrawalInFirestore FAILED:', err);
    throw new Error(err?.message || 'Failed to save withdrawal request. Please try again.');
  }
}

export async function uploadImageToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || '3f2e1a90b48c6d7e8f9a0b1c2d3e4f5a';
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.data?.url) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'ImgBB upload failed');
    }
  } catch (err: any) {
    console.warn('[ImgBB Upload Fallback] Client FileReader Data URL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}


