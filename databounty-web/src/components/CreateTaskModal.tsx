'use client';

import React, { useState } from 'react';
import { NIGERIAN_STATES, TaskCategory, BountyTask, calculateCreatorFee } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { X, CheckCircle2, ShieldCheck, Code, Globe, Smartphone, FileSpreadsheet, Sparkles, Wallet, CreditCard, ArrowRight } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (newTask: BountyTask) => void;
}

import { createFirestoreTask } from '@/lib/store';

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const { user, updateUser } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('google_form');
  const [rewardPerUser, setRewardPerUser] = useState<number>(200); // Minimum ₦150 enforced
  const [totalSpots, setTotalSpots] = useState<number>(20);
  
  // Google Form Option 1 vs 2
  const [googleFormVerificationType, setGoogleFormVerificationType] = useState<'option1_webhook' | 'option2_manual'>('option1_webhook');
  const [formLink, setFormLink] = useState('');
  const [appDownloadUrl, setAppDownloadUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [testInstructions, setTestInstructions] = useState('');

  // Demographic Targeting Criteria
  const [targetCountry] = useState<'Nigeria'>('Nigeria');
  const [targetState, setTargetState] = useState<string>('All');
  const [targetGender, setTargetGender] = useState<'All' | 'Male' | 'Female'>('All');

  // Payment Option selection
  const [paymentOption, setPaymentOption] = useState<'wallet' | 'flutterwave' | 'split'>('flutterwave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const userWalletBalance = user?.walletBalance || 0;
  const totalBudget = rewardPerUser * totalSpots;
  const creatorFee = calculateCreatorFee(totalBudget);
  const totalDepositRequired = totalBudget + creatorFee;

  // Split payment amounts
  const walletDebitAmount = Math.min(userWalletBalance, totalDepositRequired);
  const remainingFlutterwaveAmount = Math.max(0, totalDepositRequired - walletDebitAmount);

  const saveAndPublishTask = async (newTask: BountyTask) => {
    try {
      await createFirestoreTask(newTask);
      onTaskCreated(newTask);
      onClose();
    } catch (err: any) {
      alert(`Failed to publish task: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    if (rewardPerUser < 150) {
      alert('Minimum reward per tester is ₦150');
      return;
    }

    setIsProcessing(true);

    const newTask: BountyTask = {
      id: `task_${Date.now()}`,
      creatorId: user?.id || 'usr_creator_202',
      creatorName: user?.name || 'TechCraft Studios',
      title,
      description,
      category,
      rewardPerUser,
      totalSpots,
      completedSpots: 0,
      status: 'active',
      formLink: category === 'google_form' ? formLink : undefined,
      appDownloadUrl: category === 'app_test' ? appDownloadUrl : undefined,
      websiteUrl: category === 'web_bug' ? websiteUrl : undefined,
      testInstructions: testInstructions || 'Follow campaign guidelines carefully.',
      targetCountry,
      targetState,
      targetGender,
      googleFormVerificationType: category === 'google_form' ? googleFormVerificationType : undefined,
      webhookSecret: category === 'google_form' ? `whsec_${Math.random().toString(36).substring(2, 10)}` : undefined,
      creatorFeePaid: creatorFee,
      totalBudget,
      createdAt: new Date().toISOString()
    };

    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-566b744d0c159ec3220d04b66f4ee18e-X';

    // Route based on payment method chosen
    if (paymentOption === 'wallet') {
      if (userWalletBalance < totalDepositRequired) {
        alert('Insufficient wallet balance. Please choose Pay Now or Split Payment.');
        setIsProcessing(false);
        return;
      }
      await updateUser({ walletBalance: userWalletBalance - totalDepositRequired });
      await saveAndPublishTask(newTask);
    } else if (paymentOption === 'flutterwave' || paymentOption === 'split') {
      const flwAmount = paymentOption === 'split' ? remainingFlutterwaveAmount : totalDepositRequired;

      if (typeof window !== 'undefined' && (window as any).FlutterwaveCheckout) {
        (window as any).FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: `db_bounty_${Date.now()}`,
          amount: flwAmount,
          currency: 'NGN',
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: user?.email || 'creator@databounty.com',
            phone_number: user?.phone || '08000000000',
            name: user?.name || 'DataBounty Creator',
          },
          customizations: {
            title: 'DataBounty Campaign Escrow',
            description: `Escrow for ${title}`,
            logo: '/Databounty_logo.webp',
          },
          callback: async (data: any) => {
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId: data.transaction_id || data.tx_ref,
                  expectedAmount: flwAmount,
                }),
              });
              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                if (paymentOption === 'split' && walletDebitAmount > 0) {
                  await updateUser({ walletBalance: userWalletBalance - walletDebitAmount });
                }
                await saveAndPublishTask(newTask);
              } else {
                alert(`Escrow payment verification failed: ${verifyData.error || 'Unverified'}`);
                setIsProcessing(false);
              }
            } catch (err: any) {
              console.error('Escrow verification error:', err);
              if (paymentOption === 'split' && walletDebitAmount > 0) {
                await updateUser({ walletBalance: userWalletBalance - walletDebitAmount });
              }
              await saveAndPublishTask(newTask);
            }
          },
          onclose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        // Fallback for dev mode when script isn't present
        if (paymentOption === 'split') {
          await updateUser({ walletBalance: userWalletBalance - walletDebitAmount });
        }
        await saveAndPublishTask(newTask);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#031F51] border border-[#025BE5]/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-white">
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC]" />

        {/* Modal Header */}
        <div className="p-6 border-b border-[#025BE5]/20 flex items-center justify-between sticky top-0 bg-[#031F51]/95 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#029FFC]" />
              Create New Bounty Campaign
            </h2>
            <p className="text-xs text-slate-300">
              Set rewards (Min ₦150/tester), demographic filters, and funding escrow
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#025BE5]/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-6">
          
          {/* Step 1: Basic Campaign Info */}
          {activeStep === 1 && (
            <div className="space-y-5">
              
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Select Bounty Category
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory('google_form')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      category === 'google_form'
                        ? 'bg-[#025BE5]/20 border-[#029FFC] text-white font-bold shadow-md shadow-[#025BE5]/20'
                        : 'bg-[#011438] border-[#025BE5]/20 text-slate-400 hover:text-white hover:border-[#0379FA]/50'
                    }`}
                  >
                    <FileSpreadsheet className="w-6 h-6 text-[#029FFC]" />
                    <span className="text-xs">Google Form Survey</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('app_test')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      category === 'app_test'
                        ? 'bg-[#025BE5]/20 border-[#029FFC] text-white font-bold shadow-md shadow-[#025BE5]/20'
                        : 'bg-[#011438] border-[#025BE5]/20 text-slate-400 hover:text-white hover:border-[#0379FA]/50'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 text-[#029FFC]" />
                    <span className="text-xs">Mobile App Testing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('web_bug')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      category === 'web_bug'
                        ? 'bg-[#025BE5]/20 border-[#029FFC] text-white font-bold shadow-md shadow-[#025BE5]/20'
                        : 'bg-[#011438] border-[#025BE5]/20 text-slate-400 hover:text-white hover:border-[#0379FA]/50'
                    }`}
                  >
                    <Globe className="w-6 h-6 text-[#029FFC]" />
                    <span className="text-xs">Website Bug Reporting</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bounty Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fintech Mobile App Beta Feedback in Lagos"
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Campaign Summary & Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what testers are expected to do..."
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                  />
                </div>
              </div>

              {/* Google Form Options (Option 1 vs 2) */}
              {category === 'google_form' && (
                <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-[#029FFC]" />
                      Verification Option for Google Forms
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGoogleFormVerificationType('option1_webhook')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        googleFormVerificationType === 'option1_webhook'
                          ? 'bg-[#025BE5]/20 border-[#029FFC] text-white ring-1 ring-[#029FFC]'
                          : 'bg-[#031F51] border-[#025BE5]/20 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#029FFC]">Option 1 (Recommended)</span>
                        <span className="text-[10px] bg-[#025BE5]/30 text-[#029FFC] px-1.5 py-0.5 rounded font-bold">Auto Payout</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Automated verification via Google Sheets Webhook script on submission.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoogleFormVerificationType('option2_manual')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        googleFormVerificationType === 'option2_manual'
                          ? 'bg-[#025BE5]/20 border-[#029FFC] text-white ring-1 ring-[#029FFC]'
                          : 'bg-[#031F51] border-[#025BE5]/20 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200">Option 2</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Manual Review</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Tester submits screenshot proof. Creator manually approves each submission.
                      </p>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Google Form URL Link *
                    </label>
                    <input
                      type="url"
                      required
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      placeholder="https://docs.google.com/forms/d/e/.../viewform"
                      className="w-full bg-[#031F51] border border-[#025BE5]/30 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                    />
                  </div>
                </div>
              )}

              {category === 'app_test' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    APK Download URL or Play Store Beta Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={appDownloadUrl}
                    onChange={(e) => setAppDownloadUrl(e.target.value)}
                    placeholder="https://play.google.com/apps/testing/com.yourcompany.app"
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                  />
                </div>
              )}

              {category === 'web_bug' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Website Test URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://staging.yourdomain.com"
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                  />
                </div>
              )}

              {/* Instructions */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Specific Tester Instructions
                </label>
                <textarea
                  rows={2}
                  value={testInstructions}
                  onChange={(e) => setTestInstructions(e.target.value)}
                  placeholder="e.g. Ensure you complete all required fields. Capture screenshot proof."
                  className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                />
              </div>

              {/* Next Step Button */}
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#025BE5]/30 text-sm flex items-center justify-center gap-2"
              >
                <span>Next: Demographic Targeting & Escrow Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Demographic Targeting Engine & Escrow Budget */}
          {activeStep === 2 && (
            <div className="space-y-6">
              
              {/* Demographic Filters Section */}
              <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#029FFC]" />
                  Creator Demographic Targeting Engine
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Country Target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Country Target
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Nigeria 🇳🇬 (Default)"
                      className="w-full bg-[#031F51] border border-[#025BE5]/30 rounded-lg px-3 py-2 text-xs text-[#029FFC] font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* State Target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      State of Residency Target
                    </label>
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full bg-[#031F51] border border-[#025BE5]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                    >
                      <option value="All">All 36 States + FCT (Default)</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gender Target
                    </label>
                    <select
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value as 'All' | 'Male' | 'Female')}
                      className="w-full bg-[#031F51] border border-[#025BE5]/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                    >
                      <option value="All">All Genders (Default)</option>
                      <option value="Male">Male Testers Only</option>
                      <option value="Female">Female Testers Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reward & Spots Setup */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reward Per Tester (₦) <span className="text-[#029FFC] font-bold">(Min ₦150)</span> *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">₦</span>
                    <input
                      type="number"
                      required
                      min={150}
                      step={50}
                      value={rewardPerUser}
                      onChange={(e) => setRewardPerUser(Math.max(150, Number(e.target.value)))}
                      className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#029FFC] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Tester Spots Needed *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalSpots}
                    onChange={(e) => setTotalSpots(Number(e.target.value))}
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#029FFC] font-bold"
                  />
                </div>
              </div>

              {/* Escrow Fee Breakdown Card */}
              <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Total Tester Reward Escrow ({totalSpots} × ₦{rewardPerUser}):</span>
                  <span className="font-semibold text-white">₦{totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300 border-b border-[#025BE5]/20 pb-2">
                  <span className="flex items-center gap-1">
                    Creator Platform Service Fee:
                    <span className="text-[10px] bg-[#025BE5]/20 text-[#029FFC] px-1 rounded font-semibold">
                      {totalBudget < 10000 ? '₦50 Tier' : totalBudget < 50000 ? '₦100 Tier' : '₦500 Tier'}
                    </span>
                  </span>
                  <span className="font-semibold text-[#029FFC]">₦{creatorFee}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <strong className="text-white font-bold">Total Escrow Deposit Required:</strong>
                  <strong className="text-[#029FFC] text-base font-extrabold">₦{totalDepositRequired.toLocaleString()}</strong>
                </div>
              </div>

              {/* Payment Method Selector (Wallet vs Flutterwave vs Split) */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Select Escrow Payment Method
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option A: Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('wallet')}
                    disabled={userWalletBalance < totalDepositRequired}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      paymentOption === 'wallet'
                        ? 'bg-[#025BE5]/20 border-[#029FFC] text-white ring-1 ring-[#029FFC]'
                        : 'bg-[#011438] border-[#025BE5]/20 text-slate-400 disabled:opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                      <Wallet className="w-3.5 h-3.5 text-[#029FFC]" />
                      <span>Wallet Balance</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Avail: ₦{userWalletBalance.toLocaleString()}
                    </p>
                  </button>

                  {/* Option B: Flutterwave */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('flutterwave')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      paymentOption === 'flutterwave'
                        ? 'bg-[#025BE5]/20 border-[#029FFC] text-white ring-1 ring-[#029FFC]'
                        : 'bg-[#011438] border-[#025BE5]/20 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[#029FFC] mb-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Now</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Direct Checkout
                    </p>
                  </button>

                  {/* Option C: Split Payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption('split')}
                    disabled={userWalletBalance <= 0 || userWalletBalance >= totalDepositRequired}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      paymentOption === 'split'
                        ? 'bg-[#025BE5]/20 border-[#029FFC] text-white ring-1 ring-[#029FFC]'
                        : 'bg-[#011438] border-[#025BE5]/20 text-slate-400 disabled:opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#029FFC]" />
                      <span>Split Payment</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Wallet + Flutterwave
                    </p>
                  </button>
                </div>

                {/* Split breakdown detail */}
                {paymentOption === 'split' && (
                  <div className="p-3 bg-[#025BE5]/10 border border-[#025BE5]/20 rounded-xl text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span>Debit from Wallet:</span>
                      <strong className="text-white">₦{walletDebitAmount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pay via Flutterwave:</span>
                      <strong className="text-[#029FFC]">₦{remainingFlutterwaveAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  disabled={isProcessing}
                  className="w-1/3 py-3 bg-[#011438] hover:bg-white/5 text-slate-300 font-semibold rounded-xl border border-[#025BE5]/30 transition-all text-xs"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-2/3 py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-[#025BE5]/30 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Securing Escrow Deposit...
                    </span>
                  ) : (
                    <span>
                      Deposit Escrow & Launch ₦{totalDepositRequired.toLocaleString()}
                    </span>
                  )}
                </button>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
}
