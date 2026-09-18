import { db } from './firebase';
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
  role: 'tester'
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
  role: 'creator'
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
    const q = query(tasksRef, where('status', '==', 'active'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BountyTask));
    }
  } catch (err) {
    console.warn('[Firestore] fetchTasks error fallback:', err);
  }
  return [];
}

export async function createFirestoreTask(task: BountyTask): Promise<void> {
  try {
    const cleanTask = sanitizeForFirestore(task);
    const taskRef = doc(db, 'tasks', task.id);
    await setDoc(taskRef, cleanTask);

    // Deduct total budget + fee from creator escrow
    if (task.creatorId) {
      const userRef = doc(db, 'users', task.creatorId);
      await updateDoc(userRef, {
        walletBalance: increment(-task.totalBudget),
        escrowBalance: increment(task.totalBudget)
      });
    }
  } catch (err: any) {
    console.error('[Firestore] createFirestoreTask FAILED:', err);
    throw new Error(err?.message || 'Failed to save task to database. Please try again.');
  }
}

export async function submitTaskProofToFirestore(submission: TaskSubmission): Promise<void> {
  try {
    const cleanSubmission = sanitizeForFirestore(submission);
    const subRef = doc(db, 'submissions', submission.id);
    await setDoc(subRef, cleanSubmission);
  } catch (err: any) {
    console.error('[Firestore] submitTaskProofToFirestore FAILED:', err);
    throw new Error(err?.message || 'Failed to submit proof. Please try again.');
  }
}

export async function approveSubmissionInFirestore(submissionId: string, userId: string, rewardAmount: number): Promise<void> {
  try {
    const subRef = doc(db, 'submissions', submissionId);
    await updateDoc(subRef, {
      status: 'approved',
      verifiedAt: new Date().toISOString()
    });

    // Increment tester wallet balance atomically
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      walletBalance: increment(rewardAmount)
    });
  } catch (err: any) {
    console.error('[Firestore] approveSubmissionInFirestore FAILED:', err);
    throw new Error(err?.message || 'Failed to approve submission. Please try again.');
  }
}

export async function requestWithdrawalInFirestore(wd: WithdrawalRequest): Promise<void> {
  try {
    const cleanWd = sanitizeForFirestore(wd);
    const wdRef = doc(db, 'withdrawals', wd.id);
    await setDoc(wdRef, cleanWd);

    // Deduct gross amount from tester wallet
    const userRef = doc(db, 'users', wd.userId);
    await updateDoc(userRef, {
      walletBalance: increment(-wd.amount)
    });
  } catch (err: any) {
    console.error('[Firestore] requestWithdrawalInFirestore FAILED:', err);
    throw new Error(err?.message || 'Failed to save withdrawal request. Please try again.');
  }
}


