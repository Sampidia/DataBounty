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

export const INITIAL_TASKS: BountyTask[] = [
  {
    id: 'task_gf_001',
    creatorId: 'usr_creator_202',
    creatorName: 'TechCraft Studios',
    title: 'Naija E-Commerce Shopping Habits Survey',
    description: 'Provide feedback on online shopping preferences in Nigeria. High reward for detailed answers!',
    category: 'google_form',
    rewardPerUser: 500,
    totalSpots: 50,
    completedSpots: 0,
    status: 'active',
    formLink: 'https://docs.google.com/forms/d/e/1FAIpQLSc_example/viewform',
    testInstructions: 'Fill out all 10 questions in the Google Form. Auto-verified upon submission via Option 1 Google Sheet webhook.',
    targetCountry: 'Nigeria',
    targetState: 'All',
    targetGender: 'All',
    googleFormVerificationType: 'option1_webhook',
    webhookSecret: 'whsec_databounty_99812',
    creatorFeePaid: 100,
    totalBudget: 25000,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_SUBMISSIONS: TaskSubmission[] = [];
export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

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
  return INITIAL_TASKS;
}

export async function createFirestoreTask(task: BountyTask): Promise<void> {
  try {
    const taskRef = doc(db, 'tasks', task.id);
    await setDoc(taskRef, task);

    // Deduct total budget + fee from creator escrow
    if (task.creatorId) {
      const userRef = doc(db, 'users', task.creatorId);
      await updateDoc(userRef, {
        walletBalance: increment(-task.totalBudget),
        escrowBalance: increment(task.totalBudget)
      });
    }
  } catch (err) {
    console.warn('[Firestore] createFirestoreTask error fallback:', err);
  }
}

export async function submitTaskProofToFirestore(submission: TaskSubmission): Promise<void> {
  try {
    const subRef = doc(db, 'submissions', submission.id);
    await setDoc(subRef, submission);
  } catch (err) {
    console.warn('[Firestore] submitTaskProofToFirestore error fallback:', err);
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
  } catch (err) {
    console.warn('[Firestore] approveSubmissionInFirestore error fallback:', err);
  }
}

export async function requestWithdrawalInFirestore(wd: WithdrawalRequest): Promise<void> {
  try {
    const wdRef = doc(db, 'withdrawals', wd.id);
    await setDoc(wdRef, wd);

    // Deduct gross amount from tester wallet
    const userRef = doc(db, 'users', wd.userId);
    await updateDoc(userRef, {
      walletBalance: increment(-wd.amount)
    });
  } catch (err) {
    console.warn('[Firestore] requestWithdrawalInFirestore error fallback:', err);
  }
}

