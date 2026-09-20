'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TaskCard from '@/components/TaskCard';
import WithdrawModal from '@/components/WithdrawModal';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_TASKS, fetchTasksFromFirestore, submitTaskProofToFirestore, uploadImageToImgBB, reserveTaskSpotInFirestore, releaseTaskSpotInFirestore } from '@/lib/store';
import { TaskSubmission, NIGERIAN_STATES, BountyTask } from '@/lib/types';
import { Search, MapPin, Users, Clock, FileSpreadsheet, Smartphone, Globe, ExternalLink, X, Upload, AlertCircle, Image as ImageIcon, Sparkles, CheckCircle2, Wallet } from 'lucide-react';

import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function TasksPage() {
  const { user, isAuthenticated, openAuthModal, updateUser } = useAuth();
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BountyTask | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(1800);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [secretCode, setSecretCode] = useState<string>('');
  const [bugTitle, setBugTitle] = useState<string>('');
  const [bugDescription, setBugDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [verifiedRewardModal, setVerifiedRewardModal] = useState<{
    isOpen: boolean;
    rewardAmount: number;
    taskTitle: string;
  }>({
    isOpen: false,
    rewardAmount: 0,
    taskTitle: '',
  });

  const userState = user?.state || 'Lagos';
  const userGender = user?.gender || 'Female';

  useEffect(() => {
    setIsLoading(true);
    const tasksRef = collection(db, 'tasks');

    const unsubscribe = onSnapshot(
      tasksRef,
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BountyTask));
          // Sort newest first
          loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTasks(loaded);
        } else {
          setTasks([]);
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('[TasksPage] Real-time tasks snapshot error:', err);
        fetchTasksFromFirestore()
          .then((loadedTasks) => {
            setTasks(loadedTasks || []);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer: any;
    if (isTimerRunning && timerSeconds > 0) {
      timer = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      if (selectedTask?.id) {
        releaseTaskSpotInFirestore(selectedTask.id);
      }
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timerSeconds, selectedTask?.id]);

  const filteredTasks = tasks.filter((task) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    if (statusFilter !== 'all') {
      const isCompleted = task.status === 'completed' || task.completedSpots >= task.totalSpots;
      if (statusFilter === 'active' && isCompleted) return false;
      if (statusFilter === 'completed' && !isCompleted) return false;
    }

    const isStateMatch =
      stateFilter === 'all' ||
      !task.targetState ||
      task.targetState.toLowerCase() === 'all' ||
      task.targetState.toLowerCase() === stateFilter.toLowerCase();
    if (!isStateMatch) return false;

    const isGenderMatch =
      genderFilter === 'all' ||
      !task.targetGender ||
      task.targetGender.toLowerCase() === 'all' ||
      task.targetGender.toLowerCase() === genderFilter.toLowerCase();
    if (!isGenderMatch) return false;

    return true;
  });

  const handleOpenTask = (task: BountyTask) => {
    if (!isAuthenticated) {
      alert('Authentication required: Please sign in or register to claim bounties.');
      openAuthModal('tester');
      return;
    }
    setSelectedTask(task);
    setTimerSeconds(1800); // 30 minutes reservation timer
    setIsTimerRunning(true);
    setSecretCode('');
    setProofUrl('');
    reserveTaskSpotInFirestore(task.id);
  };

  const handleCloseTaskModal = () => {
    if (selectedTask?.id && timerSeconds > 0) {
      releaseTaskSpotInFirestore(selectedTask.id);
    }
    setSelectedTask(null);
    setIsTimerRunning(false);
    setSecretCode('');
    setProofUrl('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const uploadedUrl = await uploadImageToImgBB(file);
      setProofUrl(uploadedUrl);
    } catch (err: any) {
      alert(`Image upload error: ${err.message}`);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!isAuthenticated || !user) {
      alert('Authentication required: Please sign in or register to submit task proofs.');
      openAuthModal('tester');
      return;
    }

    if (selectedTask.category === 'google_form' && selectedTask.googleFormVerificationType === 'option2_manual' && !secretCode) {
      alert('Please enter the verification Secret Code displayed on your Google Form confirmation screen.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isOption1Task = selectedTask.category === 'google_form' && 
        selectedTask.googleFormVerificationType !== 'option2_manual' && 
        (selectedTask as any).verificationType !== 'OPTION2_MANUAL';

      const newSubmission: TaskSubmission = {
        id: `sub_${Date.now()}`,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        userId: user.id,
        userName: user.name,
        userEmail: user.email || '',
        userState: user.state,
        userGender: user.gender,
        rewardAmount: selectedTask.rewardPerUser,
        status: isOption1Task ? 'pending_verification' : 'pending',
        secretCode: secretCode || undefined,
        proofUrl: proofUrl || 'Submitted proof link',
        bugTitle: bugTitle || undefined,
        bugDescription: bugDescription || undefined,
        submittedAt: new Date().toISOString()
      };

      await submitTaskProofToFirestore(newSubmission);

      // Increment completed spots count
      const updatedTasks = tasks.map((t) =>
        t.id === selectedTask.id ? { ...t, completedSpots: t.completedSpots + 1 } : t
      );
      setTasks(updatedTasks);

      alert(
        isOption1Task
          ? `Submission received! Your form response is pending Option 1 Webhook verification. Wallet will be credited automatically upon confirmation.`
          : `Submission received! Your proof has been submitted to the creator for verification.`
      );

      handleCloseTaskModal();
    } catch (err: any) {
      if (err?.message?.includes('ALREADY_VERIFIED_WEBHOOK') || err?.message?.includes('already verified via Google Form')) {
        const reward = selectedTask?.rewardPerUser || 500;
        const title = selectedTask?.title || 'Google Form Bounty Task';
        handleCloseTaskModal();
        setVerifiedRewardModal({
          isOpen: true,
          rewardAmount: reward,
          taskTitle: title,
        });
      } else {
        alert(`Submission failed: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
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

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC] font-semibold"
              >
                <option value="all">All Bounties</option>
                <option value="active">Active Bounties</option>
                <option value="completed">Completed Bounties</option>
              </select>
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

          {isLoading ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-[#025BE5]/25 space-y-3">
              <div className="w-8 h-8 border-2 border-[#029FFC] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-semibold">Fetching available bounties from database...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-[#025BE5]/25 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Live Bounties Available</h3>
              <p className="text-xs text-slate-400">There are currently no active bounty campaigns matching your criteria. Check back soon!</p>
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
      {selectedTask && (() => {
        const isOption1Task = selectedTask.category === 'google_form' && 
          selectedTask.googleFormVerificationType !== 'option2_manual' && 
          (selectedTask as any).verificationType !== 'OPTION2_MANUAL';

        return (
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

                {selectedTask.category === 'google_form' && selectedTask.googleFormVerificationType === 'option2_manual' && (
                  <div>
                    <label className="block text-[11px] text-[#029FFC] font-bold mb-1 flex items-center justify-between">
                      <span>Verification Secret Code *</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Displayed on Form submission screen)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="e.g. DB-VERIFY-9982"
                      className="w-full bg-[#011438] border border-[#029FFC]/50 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] font-mono font-bold"
                    />
                  </div>
                )}

                {isOption1Task ? (
                  <div className="p-3.5 bg-[#025BE5]/20 border border-[#029FFC]/40 rounded-xl text-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[#029FFC] font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Automated Verification Active</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      No screenshot upload required! Complete and submit your response in the Google Form linked above. The email provided when filling the form must be the same email you registered with at DataBounty. Payout of <strong>₦{selectedTask.rewardPerUser.toLocaleString()}</strong> will be automatically credited to your wallet upon form submission.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-300 font-semibold">
                        Proof Screenshot URL / Reference *
                      </label>
                      <a
                        href="https://imgbb.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#029FFC] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Upload screenshot</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer bg-[#025BE5]/20 hover:bg-[#025BE5]/30 border border-[#029FFC]/40 rounded-xl px-3 py-2 text-xs text-[#029FFC] font-bold flex items-center justify-center gap-2 transition-all">
                          {isUploadingProof ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-[#029FFC] border-t-transparent rounded-full animate-spin" />
                              Uploading image...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4 text-[#029FFC]" />
                              <span>📁 Upload Screenshot</span>
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingProof || timerSeconds === 0}
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>

                    <input
                      type="text"
                      required={!isOption1Task}
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://ibb.co/xyz... or upload image file above"
                      className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                    />
                  </div>
                )}

                {timerSeconds === 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Reservation Expired! Your 30-minute spot reservation has timed out and been released.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingProof || timerSeconds === 0}
                  className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-black rounded-xl text-xs shadow-lg shadow-[#025BE5]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Verifying Submission...'
                    : timerSeconds === 0
                    ? 'Reservation Expired (Spot Released)'
                    : `Claim Bounty Reward (₦${selectedTask.rewardPerUser.toLocaleString()})`}
                </button>
              </form>

            </div>
          </div>
        </div>
        );
      })()}

      {/* Verified Reward Success Modal (Order B Webhook Auto-Credit) */}
      {verifiedRewardModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#031F51] border border-[#029FFC]/40 rounded-2xl shadow-2xl shadow-[#025BE5]/20 overflow-hidden text-white animate-in zoom-in-95 duration-200">
            {/* Top accent gradient */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC]" />

            <div className="p-6 text-center space-y-5">
              {/* Animated Glowing Icon */}
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#025BE5]/20 border-2 border-[#029FFC] text-[#029FFC] mx-auto shadow-lg shadow-[#025BE5]/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
                  ✓
                </div>
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                  Verified &amp; Paid
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Reward Credited to Your Wallet!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed px-2">
                  Your response for <strong className="text-white">"{verifiedRewardModal.taskTitle}"</strong> has been successfully verified via Google Form.
                </p>
                <div className="p-3 bg-[#011438] border border-[#025BE5]/30 rounded-xl my-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Credited Amount:</span>
                  <span className="text-lg font-black text-emerald-400">₦{verifiedRewardModal.rewardAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedRewardModal({ isOpen: false, rewardAmount: 0, taskTitle: '' });
                    setIsWithdrawModalOpen(true);
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#025BE5]/40 flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>View Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedRewardModal({ isOpen: false, rewardAmount: 0, taskTitle: '' });
                  }}
                  className="flex-1 py-3 px-4 bg-[#011438] border border-[#025BE5]/40 hover:border-[#029FFC]/60 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all"
                >
                  Continue Browsing
                </button>
              </div>
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
