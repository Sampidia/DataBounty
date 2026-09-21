export type UserRole = 'creator' | 'tester' | 'admin';

export type TaskCategory = 'google_form' | 'app_test' | 'web_bug';

export type SubmissionStatus = 'pending' | 'pending_verification' | 'approved' | 'rejected';

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

// ─── Device Specification Types ────────────────────────────────────────────
export type DeviceType = 'Android' | 'iPhone' | 'PC' | 'Tablet';

export interface DeviceSpec {
  id: string;         // uuid / nanoid for list key
  deviceType: DeviceType;
  deviceBrand: string;
  osVersion: string;
}

export const POPULAR_OS_VERSIONS: Record<DeviceType, string[]> = {
  Android: [
    'Android 17',
    'Android 16',
    'Android 15',
    'Android 14',
    'Android 13',
    'Android 12 & Below',
  ],
  iPhone: [
    'iOS 18',
    'iOS 17',
    'iOS 16',
    'iOS 15 & Below',
  ],
  PC: [
    'Windows 11',
    'Windows 10',
    'macOS Sequoia',
    'macOS Sonoma',
    'Linux',
  ],
  Tablet: [
    'iPadOS 18',
    'iPadOS 17',
    'Android Tablet 17',
    'Android Tablet 16',
    'Android Tablet 15',
    'Android Tablet 14',
    'Other',
  ],
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", 
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", 
  "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT Abuja"
] as const;

export type NigerianState = typeof NIGERIAN_STATES[number];

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female';
  country: 'Nigeria';
  state: NigerianState | string;
  // Multi-device specification (replaces flat deviceBrand/deviceModel/osVersion)
  devices?: DeviceSpec[];
  // Legacy flat device fields (kept for backward-compat, prefer `devices`)
  deviceBrand?: string;
  deviceModel?: string;
  osVersion?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  walletBalance: number;
  escrowBalance: number;
  role: UserRole;
  status?: 'active' | 'suspended';
}

export interface BountyTask {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  category: TaskCategory;
  rewardPerUser: number;
  totalSpots: number;
  completedSpots: number;
  reservedSpots?: number;
  pendingSpots?: number;
  status: 'active' | 'completed' | 'paused' | 'suspended';
  formLink?: string;
  appDownloadUrl?: string;
  websiteUrl?: string;
  testInstructions: string;
  // Demographic Targeting Criteria
  targetCountry: 'Nigeria';
  targetState: 'All' | NigerianState | string;
  targetGender: 'All' | 'Male' | 'Female';
  targetDeviceType?: 'All' | DeviceType | string;
  targetOsVersion?: 'All' | string;
  // Google Form Verification Option
  googleFormVerificationType?: 'option1_webhook' | 'option2_manual';
  webhookSecret?: string;
  creatorFeePaid: number;
  totalBudget: number;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userState: string;
  userGender: string;
  rewardAmount: number;
  status: SubmissionStatus;
  secretCode?: string;
  proofUrl?: string;
  screenshotUrl?: string;
  bugTitle?: string;
  bugSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
  bugDescription?: string;
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  bankCode?: string;
  bankTag?: string;
  accountNumber: string;
  accountName: string;
  status: WithdrawalStatus;
  requestedAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'escrow_deposit' | 'task_reward' | 'withdrawal' | 'creator_fee' | 'withdrawal_fee';
  amount: number;
  description: string;
  status?: string;
  timestamp: string;
}

// Helper utility functions for Fee Structures
export function calculateCreatorFee(totalBudget: number): number {
  if (totalBudget < 10000) return 50;
  if (totalBudget < 50000) return 100;
  return 500;
}

export function calculateWithdrawalFee(amount: number): number {
  if (amount < 10000) return 50;
  return 100;
}
