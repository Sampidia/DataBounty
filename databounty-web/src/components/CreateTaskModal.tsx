'use client';

import React, { useState } from 'react';
import { NIGERIAN_STATES, TaskCategory, BountyTask, calculateCreatorFee } from '@/lib/types';
import { X, CheckCircle2, ShieldCheck, Code, Globe, Smartphone, FileSpreadsheet, Sparkles, HelpCircle } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (newTask: BountyTask) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('google_form');
  const [rewardPerUser, setRewardPerUser] = useState<number>(500);
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

  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const totalBudget = rewardPerUser * totalSpots;
  const creatorFee = calculateCreatorFee(totalBudget);
  const totalDepositRequired = totalBudget + creatorFee;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const newTask: BountyTask = {
      id: `task_${Date.now()}`,
      creatorId: 'usr_creator_202',
      creatorName: 'TechCraft Studios',
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

    onTaskCreated(newTask);
    onClose();
  };

  const sampleAppsScriptCode = `// Google Apps Script snippet for DataBounty Option 1 Auto-Payout
function onFormSubmit(e) {
  var userEmail = e.values[1]; // Adjust column index for email
  var payload = {
    "userEmail": userEmail,
    "formId": "FORM_ID_HERE",
    "secret": "WH_SECRET_HERE"
  };
  UrlFetchApp.fetch("https://databounty.sampidia.com/api/webhooks/google-form", {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  });
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Create New Bounty Campaign
            </h2>
            <p className="text-xs text-gray-400">
              Set rewards, demographic filters, and funding escrow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
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
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  1. Select Bounty Category
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory('google_form')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      category === 'google_form'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold glow-emerald'
                        : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-6 h-6" />
                    <span className="text-xs">Google Form Survey</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('app_test')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      category === 'app_test'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold glow-cyan'
                        : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="text-xs">Mobile App Testing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('web_bug')}
                    className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                      category === 'web_bug'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400 font-bold'
                        : 'bg-gray-800/40 border-gray-700/60 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-6 h-6" />
                    <span className="text-xs">Website Bug Reporting</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Bounty Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fintech Mobile App Beta Feedback in Lagos"
                    className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Campaign Summary & Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what testers are expected to do..."
                    className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Google Form Options (Option 1 vs 2) */}
              {category === 'google_form' && (
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-emerald-400" />
                      Verification Option for Google Forms
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGoogleFormVerificationType('option1_webhook')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        googleFormVerificationType === 'option1_webhook'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500'
                          : 'bg-gray-900 border-gray-800 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-400">Option 1 (Recommended)</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Auto Payout</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Automated verification via Google Sheets Webhook script on submission.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoogleFormVerificationType('option2_manual')}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        googleFormVerificationType === 'option2_manual'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500'
                          : 'bg-gray-900 border-gray-800 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-200">Option 2</span>
                        <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">Manual Review</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Tester submits screenshot proof. Creator manually approves each submission.
                      </p>
                    </button>
                  </div>

                  {googleFormVerificationType === 'option1_webhook' && (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-xs space-y-2">
                      <p className="text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Option 1 Setup Instructions:
                      </p>
                      <ol className="list-decimal list-inside text-gray-300 space-y-1 text-[11px]">
                        <li>Create your Google Form and link it to a Google Sheet.</li>
                        <li>In Google Sheet, open <strong>Extensions &gt; Apps Script</strong>.</li>
                        <li>Paste our lightweight Apps Script trigger code to notify DataBounty on submission.</li>
                      </ol>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Google Form URL Link *
                    </label>
                    <input
                      type="url"
                      required
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      placeholder="https://docs.google.com/forms/d/e/.../viewform"
                      className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {category === 'app_test' && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    APK Download URL or Play Store Beta Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={appDownloadUrl}
                    onChange={(e) => setAppDownloadUrl(e.target.value)}
                    placeholder="https://play.google.com/apps/testing/com.yourcompany.app"
                    className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {category === 'web_bug' && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Website Test URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://staging.yourdomain.com"
                    className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Instructions */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Specific Tester Instructions
                </label>
                <textarea
                  rows={2}
                  value={testInstructions}
                  onChange={(e) => setTestInstructions(e.target.value)}
                  placeholder="e.g. Ensure you complete all required fields. For app testing, capture your user profile ID in screenshot."
                  className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Next Step Button */}
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl transition-all shadow-lg"
              >
                Next: Demographic Targeting & Budget &rarr;
              </button>
            </div>
          )}

          {/* Step 2: Demographic Targeting Engine & Escrow Budget */}
          {activeStep === 2 && (
            <div className="space-y-6">
              
              {/* Demographic Filters Section */}
              <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Creator Demographic Targeting Engine
                </h3>
                <p className="text-xs text-gray-400">
                  Filter which testers are eligible to see and complete this bounty campaign.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Country Target */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Country Target
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Nigeria 🇳🇬 (Default)"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* State Target */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      State of Residency Target
                    </label>
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Gender Target
                    </label>
                    <select
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value as 'All' | 'Male' | 'Female')}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Reward Per Tester (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">₦</span>
                    <input
                      type="number"
                      required
                      min={50}
                      step={50}
                      value={rewardPerUser}
                      onChange={(e) => setRewardPerUser(Number(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Total Tester Spots Needed *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalSpots}
                    onChange={(e) => setTotalSpots(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Escrow Fee Breakdown Card */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Total Tester Reward Escrow ({totalSpots} × ₦{rewardPerUser}):</span>
                  <span className="font-semibold text-white">₦{totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-300 border-b border-emerald-500/20 pb-2">
                  <span className="flex items-center gap-1">
                    Creator Platform Service Fee:
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded">
                      {totalBudget < 10000 ? '₦50 Tier' : totalBudget < 50000 ? '₦100 Tier' : '₦500 Tier'}
                    </span>
                  </span>
                  <span className="font-semibold text-emerald-400">₦{creatorFee}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <strong className="text-white font-bold">Total Deposit Required:</strong>
                  <strong className="text-emerald-400 text-base font-extrabold">₦{totalDepositRequired.toLocaleString()}</strong>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="w-1/3 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-all"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-extrabold rounded-xl transition-all shadow-lg glow-emerald"
                >
                  Confirm & Deposit Escrow ₦{totalDepositRequired.toLocaleString()}
                </button>
              </div>

            </div>
          )}

        </form>
      </div>
    </div>
  );
}
