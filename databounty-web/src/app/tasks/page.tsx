'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TaskCard from '@/components/TaskCard';
import WithdrawModal from '@/components/WithdrawModal';
import { INITIAL_USER, INITIAL_TASKS } from '@/lib/store';
import { NIGERIAN_STATES, UserRole, BountyTask, TaskSubmission } from '@/lib/types';
import { Search, Filter, MapPin, Users, Clock, CheckCircle2, FileSpreadsheet, Smartphone, Globe, ExternalLink, X, ShieldCheck, Upload, AlertCircle } from 'lucide-react';

export default function TasksPage() {
  const [userRole, setUserRole] = useState<UserRole>('tester');
  const [user, setUser] = useState(INITIAL_USER);
  const [tasks, setTasks] = useState<BountyTask[]>(INITIAL_TASKS);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>(user.state);
  const [genderFilter, setGenderFilter] = useState<string>(user.gender);

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
      setUser({ ...user, walletBalance: user.walletBalance + reward });

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
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Navbar
        currentRole={userRole}
        setRole={setUserRole}
        walletBalance={user.walletBalance}
        openWithdrawModal={() => setIsWithdrawModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                Tester Task Feed
              </span>
              <span className="text-xs text-gray-400">
                Your Profile: <strong className="text-emerald-400">{user.state} State</strong> • <strong className="text-teal-300">{user.gender}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explore Available Micro-Task Bounties
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Tasks filtered according to your profile demographics. Minimum cashout threshold is ₦100.
            </p>
          </div>
        </div>

        {/* Demographic & Category Filter Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bounties..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Showing <strong>{filteredTasks.length}</strong> matching bounty campaigns</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-gray-800 space-y-3">
              <AlertCircle className="w-10 h-10 text-gray-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Bounties Found</h3>
              <p className="text-xs text-gray-400">Try relaxing your demographic filter criteria or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onSelectTask={handleOpenTask}
                  userState={user.state}
                  userGender={user.gender}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />

      {/* Task Execution Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    {selectedTask.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">₦{selectedTask.rewardPerUser.toLocaleString()} Reward</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedTask.title}</h3>
              </div>

              {/* Reservation Timer Pill */}
              <div className="flex items-center gap-3">
                <div className="bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Spot Reserved: {formatTimer(timerSeconds)}</span>
                </div>
                <button onClick={handleCloseTaskModal} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Task Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Overview</h4>
                <p className="text-xs text-gray-300 leading-relaxed bg-gray-950 p-4 rounded-xl border border-gray-800">
                  {selectedTask.description}
                </p>
              </div>

              {/* Specific Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instructions for Tester</h4>
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 leading-relaxed">
                  {selectedTask.testInstructions}
                </div>
              </div>

              {/* Execution Links */}
              {selectedTask.category === 'google_form' && selectedTask.formLink && (
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Google Form URL
                    </span>
                    {selectedTask.googleFormVerificationType === 'option1_webhook' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        Option 1 Auto-Payout
                      </span>
                    )}
                  </div>
                  <a
                    href={selectedTask.formLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-4 py-3 rounded-xl text-xs transition-all shadow-md"
                  >
                    <span>Launch Google Form Survey in New Tab</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedTask.category === 'app_test' && selectedTask.appDownloadUrl && (
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-teal-400" />
                    Android App APK Link
                  </span>
                  <a
                    href={selectedTask.appDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-3 rounded-xl text-xs transition-all shadow-md"
                  >
                    <span>Download APK & Install App</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {selectedTask.category === 'web_bug' && selectedTask.websiteUrl && (
                <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-purple-400" />
                    Target Website URL
                  </span>
                  <a
                    href={selectedTask.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-3 rounded-xl text-xs transition-all shadow-md"
                  >
                    <span>Open Web App for Bug Testing</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Proof Submission Form */}
              <form onSubmit={handleSubmitProof} className="space-y-4 pt-2 border-t border-gray-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" />
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
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <textarea
                      rows={2}
                      required
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      placeholder="Steps to reproduce..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Proof Screenshot URL / Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... or Google Form submission confirmation screenshot"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black rounded-xl text-xs shadow-lg transition-all glow-emerald flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Verifying Submission...' : `Claim Bounty Reward (₦${selectedTask.rewardPerUser.toLocaleString()})`}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        user={user}
        onWithdrawSubmitted={(wd) => {
          setUser({ ...user, walletBalance: user.walletBalance - wd.amount });
          alert(`Withdrawal request submitted! Payout of ₦${wd.netAmount.toLocaleString()} pending.`);
        }}
      />
    </div>
  );
}
