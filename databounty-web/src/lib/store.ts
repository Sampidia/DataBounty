import { BountyTask, TaskSubmission, UserProfile, WithdrawalRequest, Transaction, calculateCreatorFee, calculateWithdrawalFee } from './types';

// Seed Initial Data
export const INITIAL_USER: UserProfile = {
  id: 'usr_tester_101',
  name: 'Amina Bello',
  email: 'amina.bello@example.com',
  phone: '+2348012345678',
  gender: 'Female',
  country: 'Nigeria',
  state: 'Lagos',
  deviceBrand: 'Samsung',
  deviceModel: 'Galaxy A54 5G',
  osVersion: 'Android 14 (API 34)',
  bankName: 'Guaranty Trust Bank (GTBank)',
  accountNumber: '0123456789',
  accountName: 'AMINA BELLO',
  walletBalance: 4500,
  escrowBalance: 0,
  role: 'tester'
};

export const INITIAL_CREATOR: UserProfile = {
  id: 'usr_creator_202',
  name: 'TechCraft Studios Nigeria',
  email: 'creator@techcraft.ng',
  phone: '+2348098765432',
  gender: 'Male',
  country: 'Nigeria',
  state: 'FCT Abuja',
  deviceBrand: 'Apple',
  deviceModel: 'MacBook Pro M2',
  osVersion: 'macOS Sonoma',
  bankName: 'Zenith Bank',
  accountNumber: '2081234567',
  accountName: 'TECHCRAFT STUDIOS LTD',
  walletBalance: 150000,
  escrowBalance: 35000,
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
    completedSpots: 32,
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
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'task_app_002',
    creatorId: 'usr_creator_202',
    creatorName: 'PayQuick FinTech',
    title: 'Android Beta Testing: PayQuick Money Transfer App',
    description: 'Test native Android money transfer app performance on Samsung and Transsion devices in Lagos & Abuja.',
    category: 'app_test',
    rewardPerUser: 1200,
    totalSpots: 20,
    completedSpots: 14,
    status: 'active',
    appDownloadUrl: 'https://databounty.sampidia.com/downloads/payquick-beta.apk',
    testInstructions: 'Download APK, complete signup flow, test biometric login, and upload screenshot of home dashboard.',
    targetCountry: 'Nigeria',
    targetState: 'Lagos',
    targetGender: 'Female',
    creatorFeePaid: 100,
    totalBudget: 24000,
    createdAt: '2026-09-14T14:30:00Z'
  },
  {
    id: 'task_bug_003',
    creatorId: 'usr_creator_202',
    creatorName: 'Konga Vendor Solutions',
    title: 'Merchant Dashboard Checkout Bug Hunting',
    description: 'Find broken links, checkout calculation glitches, or layout responsiveness issues on web app.',
    category: 'web_bug',
    rewardPerUser: 2500,
    totalSpots: 10,
    completedSpots: 10,
    status: 'completed',
    websiteUrl: 'https://staging.konga-vendors.example.com',
    testInstructions: 'Navigate checkout flow with test cards. Submit structured bug title, steps to reproduce, and screenshot.',
    targetCountry: 'Nigeria',
    targetState: 'All',
    targetGender: 'All',
    creatorFeePaid: 100,
    totalBudget: 25000,
    createdAt: '2026-09-10T09:15:00Z'
  }
];

export const INITIAL_SUBMISSIONS: TaskSubmission[] = [
  {
    id: 'sub_001',
    taskId: 'task_gf_001',
    taskTitle: 'Naija E-Commerce Shopping Habits Survey',
    userId: 'usr_tester_101',
    userName: 'Amina Bello',
    userState: 'Lagos',
    userGender: 'Female',
    rewardAmount: 500,
    status: 'approved',
    proofUrl: 'Verified via Option 1 Google Form Webhook',
    submittedAt: '2026-09-15T11:20:00Z',
    verifiedAt: '2026-09-15T11:20:05Z'
  },
  {
    id: 'sub_002',
    taskId: 'task_app_002',
    taskTitle: 'Android Beta Testing: PayQuick Money Transfer App',
    userId: 'usr_tester_101',
    userName: 'Amina Bello',
    userState: 'Lagos',
    userGender: 'Female',
    rewardAmount: 1200,
    status: 'pending',
    screenshotUrl: 'https://images.unsplash.com/photo-1556742049-0a67daf4095a?w=800&auto=format&fit=crop&q=80',
    submittedAt: '2026-09-16T15:45:00Z'
  }
];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd_7001',
    userId: 'usr_tester_101',
    userName: 'Amina Bello',
    userEmail: 'amina.bello@example.com',
    amount: 3000,
    fee: 50,
    netAmount: 2950,
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0123456789',
    accountName: 'AMINA BELLO',
    status: 'COMPLETED',
    requestedAt: '2026-09-12T08:30:00Z',
    updatedAt: '2026-09-12T09:00:00Z'
  },
  {
    id: 'wd_7002',
    userId: 'usr_tester_102',
    userName: 'Chidi Okonkwo',
    userEmail: 'chidi.okonkwo@example.com',
    amount: 15000,
    fee: 100,
    netAmount: 14900,
    bankName: 'Access Bank',
    accountNumber: '0098765432',
    accountName: 'CHIDI OKONKWO',
    status: 'PENDING',
    requestedAt: '2026-09-16T17:10:00Z'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1001',
    userId: 'usr_creator_202',
    userName: 'TechCraft Studios',
    type: 'escrow_deposit',
    amount: 25000,
    description: 'Escrow deposit for Bounty task: Naija E-Commerce Shopping Habits Survey',
    timestamp: '2026-09-15T10:00:00Z'
  },
  {
    id: 'tx_1002',
    userId: 'usr_creator_202',
    userName: 'TechCraft Studios',
    type: 'creator_fee',
    amount: 100,
    description: 'Platform Creator Fee (₦10,000–₦49,999 budget tier)',
    timestamp: '2026-09-15T10:00:00Z'
  },
  {
    id: 'tx_1003',
    userId: 'usr_tester_101',
    userName: 'Amina Bello',
    type: 'task_reward',
    amount: 500,
    description: 'Auto-payout reward for Google Form verification',
    timestamp: '2026-09-15T11:20:05Z'
  },
  {
    id: 'tx_1004',
    userId: 'usr_tester_101',
    userName: 'Amina Bello',
    type: 'withdrawal_fee',
    amount: 50,
    description: 'Withdrawal fee for ₦3,000 cashout (₦100–₦9,999 tier)',
    timestamp: '2026-09-12T08:30:00Z'
  }
];
