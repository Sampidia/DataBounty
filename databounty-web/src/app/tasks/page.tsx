'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TaskCard from '@/components/TaskCard';
import WithdrawModal from '@/components/WithdrawModal';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_TASKS } from '@/lib/store';
import { NIGERIAN_STATES, BountyTask } from '@/lib/types';
import { Search, MapPin, Users, Clock, FileSpreadsheet, Smartphone, Globe, ExternalLink, X, Upload, AlertCircle } from 'lucide-react';

export default function TasksPage() {
  const { user, updateUser } = useAuth();
  const [tasks, setTasks] = useState<BountyTask[]>(INITIAL_TASKS);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const userState = user?.state || 'Lagos';
  const userGender = user?.gender || 'Female';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>(userState);
  const [genderFilter, setGenderFilter] = useState<string>(userGender);

  useEffect(() => {
    if (user) {
      setStateFilter(user.state);
      setGenderFilter(user.gender);
    }
  }, [user]);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<BountyTask | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(900); // 15 mins timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start Reservation Countdown Timer when modal opens
  useEffect(() => {
    let interval: any = null;
    if (selectedTask && isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [selectedTask, isTimerRunning, timerSeconds]);

  const handleOpenTask = (task: BountyTask) => {
    setSelectedTask(task);
    setTimerSeconds(900);
    setIsTimerRunning(true);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setIsTimerRunning(false);
  };

  // Filter Tasks according to Search, Category, State, Gender
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    
    // Demographic Eligibility
    const matchesState = stateFilter === 'all' || t.targetState === 'All' || t.targetState === stateFilter;
    const matchesGender = genderFilter === 'all' || t.targetGender === 'All' || t.targetGender === genderFilter;

    return matchesSearch && matchesCategory && matchesState && matchesGender;
  });

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Update Task completed spots
      const updatedTasks = tasks.map((t) =>
        t.id === selectedTask.id ? { ...t, completedSpots: t.completedSpots + 1 } : t
      );
      setTasks(updatedTasks);

      // Award User Wallet Balance
      const reward = selectedTask.rewardPerUser;
      if (user) {
        updateUser({ walletBalance: (user.walletBalance || 0) + reward });
      }

      alert(`Submission successful! Reward of ₦${reward.toLocaleString()} added to your wallet.`);
      handleCloseTaskModal();
    }, 1000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#011438]">
      <Navbar openWithdrawModal={() => setIsWithdrawModalOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#025BE5]/20 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-[#025BE5]/20 text-[#029FFC] text-xs font-bold uppercase tracking-wider border border-[#025BE5]/30">
                Tester Task Feed
              </span>
              <span className="text-xs text-slate-400">
                Your Profile: <strong className="text-[#029FFC]">{userState} State</strong> • <strong className="text-[#029FFC]">{userGender}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore Available Micro-Task Bounties
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Tasks filtered according to your profile demographics. Minimum cashout threshold is ₦100.
            </p>
          </div>
        </div>

        {/* Demographic & Category Filter Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-[#025BE5]/25 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bounties..."
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
              >
                <option value="all">All Task Categories</option>
                <option value="google_form">Google Form Surveys</option>
                <option value="app_test">Mobile App Testing</option>
                <option value="web_bug">Website Bug Reports</option>
              </select>
            </div>

            {/* State Filter */}
            <div>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
              >
                <option value="all">Match All Nigerian States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s} State
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
              >
                <option value="all">Match All Genders</option>
                <option value="Male">Male Testers</option>
                <option value="Female">Female Testers</option>
              </select>
            </div>

          </div>
        </div>

        {/* Tasks Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing <strong>{filteredTasks.length}</strong> matching bounty campaigns</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-[#025BE5]/25 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Bounties Found</h3>
              <p className="text-xs text-slate-400">Try relaxing your demographic filter criteria or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onSelectTask={handleOpenTask}
                  userState={userState}
                  userGender={userGender}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />

      {/* Task Execution Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#031F51] border border-[#025BE5]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-white">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#025BE5]/20 bg-[#011438] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-[#025BE5]/20 text-[#029FFC] text-[10px] font-bold uppercase border border-[#025BE5]/30">
                    {selectedTask.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-[#029FFC]">₦{selectedTask.rewardPerUser.toLocaleString()} Reward</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
              </div>

              {/* Reservation Timer Pill */}
              <div className="flex items-center gap-3">
                <div className="bg-[#011438] border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Spot Reserved: {formatTimer(timerSeconds)}</span>
                </div>
                <button onClick={handleCloseTaskModal} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Task Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Overview</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#011438] p-4 rounded-xl border border-[#025BE5]/20">
                  {selectedTask.description}
                </p>
              </div>

              {/* Specific Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions for Tester</h4>
                <div className="p-4 bg-[#025BE5]/10 border border-[#025BE5]/20 rounded-xl text-xs text-slate-300 leading-relaxed">
                  {selectedTask.testInstructions}
                </div>
              </div>

              {/* Execution Links */}
              {selectedTask.category === 'google_form' && selectedTask.formLink && (
                <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[#029FFC]" />
                      Google Form URL
                    </span>
                    {selectedTask.googleFormVerificationType === 'option1_webhook' && (
                      <span className="text-[10px] bg-[#025BE5]/20 text-[#029FFC] px-2 py-0.5 rounded font-bold border border-[#025BE5]/30">
                        Option 1 Auto-Payout
                      </span>
                    )}
                  </div>
                  <a
                    href={selectedTask.formLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold px-4 py-3 rounded-xl text-xs transition-all shadow-md"
                  >
                    <span>Launch Google Form Survey in New Tab</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedTask.category === 'app_test' && selectedTask.appDownloadUrl && (
                <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#029FFC]" />
                    Android App APK Link
                  </span>
                  <a
                    href={selectedTask.appDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold px-4 py-3 rounded-xl text-xs transition-all shadow-md"
                  >
                    <span>Download APK & Install App</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedTask.category === 'web_bug' && selectedTask.websiteUrl && (
                <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#029FFC]" />
                    Target Website URL
                  </span>
                  <a
                    href={selectedTask.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold px-4 py-3 rounded-xl text-xs transition-all shadow-md"
                  >
                    <span>Open Web App for Bug Testing</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Proof Submission Form */}
              <form onSubmit={handleSubmitProof} className="space-y-4 pt-2 border-t border-[#025BE5]/20">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#029FFC]" />
                  Submit Task Proof & Complete Bounty
                </h4>

                {selectedTask.category === 'web_bug' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      placeholder="Bug Summary / Title"
                      className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                    />
                    <textarea
                      rows={2}
                      required
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="Steps to reproduce..."
                      className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Proof Screenshot URL / Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Google Form submission confirmation screenshot"
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-black rounded-xl text-xs shadow-lg shadow-[#025BE5]/30 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Verifying Submission...' : `Claim Bounty Reward (₦${selectedTask.rewardPerUser.toLocaleString()})`}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

      {user && (
        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          user={user}
          onWithdrawSubmitted={(wd) => {
            updateUser({ walletBalance: user.walletBalance - wd.amount });
            alert(`Withdrawal request submitted! Payout of ₦${wd.netAmount.toLocaleString()} pending.`);
          }}
        />
      )}
    </div>
  );
}
