'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateTaskModal from '@/components/CreateTaskModal';
import { TopUpModal } from '@/components/TopUpModal';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_SUBMISSIONS, approveSubmissionInFirestore } from '@/lib/store';
import { BountyTask, TaskSubmission } from '@/lib/types';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { BarChart3, PlusCircle, Wallet, CheckCircle2, Clock, Users, MapPin, Sparkles, LogIn, Lock, Check, X, Key, ExternalLink } from 'lucide-react';

export default function CreatorDashboard() {
  const { user, role, isAuthenticated, openAuthModal, updateUser } = useAuth();
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [processingSubId, setProcessingSubId] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [rejectionModalSub, setRejectionModalSub] = useState<TaskSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [manualReviewFilter, setManualReviewFilter] = useState<'all' | 'google_form' | 'app_test' | 'web_bug'>('all');
  const [reviewPage, setReviewPage] = useState<number>(1);
  const REVIEWS_PER_PAGE = 15;

  // Helper to get category for a submission's parent task
  const getSubmissionCategory = (sub: TaskSubmission): string => {
    const parentTask = tasks.find((t) => t.id === sub.taskId);
    return parentTask?.category || 'google_form';
  };

  const handleFilterChange = (filter: 'all' | 'google_form' | 'app_test' | 'web_bug') => {
    setManualReviewFilter(filter);
    setReviewPage(1);
  };

  // Fetch creator's tasks from Firestore with real-time listener
  useEffect(() => {
    if (user?.id) {
      setIsLoadingTasks(true);
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('creatorId', '==', user.id));

      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BountyTask));
            loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTasks(loaded);
          } else {
            setTasks([]);
          }
          setIsLoadingTasks(false);
        },
        (err) => {
          console.warn('[CreatorDashboard] Firestore fetch error:', err);
          setIsLoadingTasks(false);
        }
      );

      return () => unsubscribe();
    }
  }, [user?.id]);

  // Fetch submissions ONLY for creator's tasks (Creator Data Isolation)
  useEffect(() => {
    if (user?.id && tasks.length > 0) {
      const creatorTaskIds = tasks.map((t) => t.id);
      const subsRef = collection(db, 'submissions');
      const unsubscribe = onSnapshot(
        subsRef,
        (snap) => {
          if (!snap.empty) {
            const allSubs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskSubmission));
            const creatorSubs = allSubs.filter((s) => creatorTaskIds.includes(s.taskId));
            creatorSubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setSubmissions(creatorSubs);
          } else {
            setSubmissions([]);
          }
        },
        (err) => console.warn('[CreatorSubmissions] snapshot error:', err)
      );
      return () => unsubscribe();
    } else if (tasks.length === 0) {
      setSubmissions([]);
    }
  }, [user?.id, tasks]);

  const handleApprove = async (sub: TaskSubmission) => {
    setProcessingSubId(sub.id);
    try {
      await approveSubmissionInFirestore(sub.id, sub.userId, sub.rewardAmount);
      alert(`Payout of ₦${sub.rewardAmount.toLocaleString()} approved! Wallet credited for tester.`);
    } catch (err: any) {
      alert(`Failed to approve submission: ${err.message}`);
    } finally {
      setProcessingSubId(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectionModalSub) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejecting this submission.');
      return;
    }
    setIsRejecting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: rejectionModalSub.id,
          rejectionReason: rejectionReason.trim(),
          idToken
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject submission');
      }

      alert('Submission rejected and notification email dispatched.');
      setRejectionModalSub(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(`Failed to reject submission: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  // Compute metrics
  const activeTasksCount = tasks.filter((t) => t.status === 'active').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalEscrowDeposited = tasks.reduce((sum, t) => sum + t.totalBudget + t.creatorFeePaid, 0);
  
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length;
  const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected').length;
  const totalRewardsPaid = submissions.filter((s) => s.status === 'approved').reduce((sum, s) => sum + s.rewardAmount, 0);

  // Recharts Data Sets
  const donutData = [
    { name: 'Completed Tasks', value: completedTasksCount, color: '#025BE5' },
    { name: 'Active In-Progress Tasks', value: activeTasksCount, color: '#029FFC' },
  ];

  const funnelData = [
    { name: 'Approved', count: approvedSubmissions, fill: '#025BE5' },
    { name: 'Pending Review', count: pendingSubmissions, fill: '#0379FA' },
    { name: 'Rejected', count: rejectedSubmissions, fill: '#ef4444' },
  ];

  const handleTaskCreated = (newTask: BountyTask) => {
    setTasks([newTask, ...tasks]);
  };

  const isAccessAllowed = isAuthenticated && (role === 'creator' || role === 'admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#011438]">
      <Navbar
        openCreateTaskModal={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {!isAccessAllowed ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/40">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Creator Dashboard Locked</h2>
            <p className="text-sm text-slate-300">
              {isAuthenticated
                ? "Your current account is set to Tester mode. Switch your account role to Creator to publish campaigns."
                : "Please sign in as a Creator or Admin to publish bounty campaigns and track analytics."}
            </p>
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  await updateUser({ role: 'creator' });
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Switch Role to Creator</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('creator')}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In as Creator</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#025BE5]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-[#025BE5]/20 text-[#029FFC] text-xs font-bold uppercase tracking-wider border border-[#025BE5]/30">
                    Creator Suite
                  </span>
                  <span className="text-xs text-slate-400">{user?.name || 'TechCraft Studios Nigeria'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-7 h-7 text-[#029FFC]" />
                  Creator Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Monitor active task completion progress, submission funnels, and demographic targeting.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-[#011438] hover:bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/40 font-bold px-4 py-3 rounded-xl transition-all text-sm"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Top Up Wallet</span>
                </button>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm hover:scale-[1.02]"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Publish New Bounty Task</span>
                </button>
              </div>
            </div>

            {/* 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                  <span>Active Tasks</span>
                  <Clock className="w-4 h-4 text-[#029FFC]" />
                </div>
                <div className="text-2xl font-black text-white">{activeTasksCount} Tasks</div>
                <p className="text-[11px] text-slate-400">Total {tasks.length} campaigns published</p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                  <span>Total Escrow Budget</span>
                  <Wallet className="w-4 h-4 text-[#029FFC]" />
                </div>
                <div className="text-2xl font-black text-[#029FFC]">₦{totalEscrowDeposited.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">Includes creator service fees</p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                  <span>Total Rewards Paid</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">₦{totalRewardsPaid.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">{approvedSubmissions} approved payouts</p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                  <span>Available Wallet Balance</span>
                  <Sparkles className="w-4 h-4 text-[#029FFC]" />
                </div>
                <div className="text-2xl font-black text-[#029FFC]">₦{(user?.walletBalance || 0).toLocaleString()}</div>
                <button 
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="text-[11px] text-[#029FFC] font-bold hover:underline block"
                >
                  + Top Up Balance
                </button>
              </div>
            </div>

            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart 1: Donut Chart - Completed vs Uncompleted Tasks */}
              <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Campaign Progress Breakdown</h3>
                  <p className="text-xs text-slate-400">Completed vs. Active In-Progress Bounties</p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#011438', borderColor: '#025BE5', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Submissions Funnel Chart */}
              <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Submissions Review Funnel</h3>
                  <p className="text-xs text-slate-400">Breakdown of total tester submissions received</p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#025BE5/20" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#011438', borderColor: '#025BE5', borderRadius: '12px', color: '#fff' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Manual Verification Review & Approval Suite */}
            {(() => {
              const allManualSubmissions = submissions.filter((s) => s.secretCode || s.status === 'pending');
              const filteredManualSubmissions = allManualSubmissions.filter((sub) => {
                if (manualReviewFilter === 'all') return true;
                return getSubmissionCategory(sub) === manualReviewFilter;
              });
              const totalPages = Math.ceil(filteredManualSubmissions.length / REVIEWS_PER_PAGE) || 1;
              const paginatedSubmissions = filteredManualSubmissions.slice(
                (reviewPage - 1) * REVIEWS_PER_PAGE,
                reviewPage * REVIEWS_PER_PAGE
              );

              return (
                <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-[#029FFC]" />
                      Manual Reviews
                    </h3>

                    {/* Filter Tab Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#011438] rounded-xl border border-[#025BE5]/30">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'google_form', label: 'Google Form' },
                        { id: 'app_test', label: 'Mobile App' },
                        { id: 'web_bug', label: 'Web Bug' },
                      ].map((tab) => {
                        const isActive = manualReviewFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleFilterChange(tab.id as any)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                              isActive
                                ? 'bg-[#025BE5] text-white shadow-md shadow-[#025BE5]/30'
                                : 'text-slate-400 hover:text-white hover:bg-[#025BE5]/10'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {filteredManualSubmissions.length === 0 ? (
                    <div className="p-8 text-center bg-[#011438] rounded-xl border border-[#025BE5]/20 text-slate-400 text-xs">
                      No submissions currently pending manual review for this category.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30 sticky top-0 z-10">
                            <tr>
                              <th className="p-3">Tester</th>
                              <th className="p-3">Bounty Task</th>
                              <th className="p-3">Tester Secret Code</th>
                              <th className="p-3">Proof Screenshot</th>
                              <th className="p-3">Reward</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#025BE5]/20 text-slate-300">
                            {paginatedSubmissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-[#025BE5]/10">
                                <td className="p-3 font-semibold text-white">
                                  <div>{sub.userName}</div>
                                  <div className="text-[10px] text-slate-400">{sub.userState} • {sub.userGender}</div>
                                </td>
                                <td className="p-3 font-medium text-slate-200 max-w-xs truncate">
                                  {sub.taskTitle}
                                </td>
                                <td className="p-3">
                                  {sub.secretCode ? (
                                    <span className="px-2.5 py-1 rounded bg-[#029FFC]/20 text-[#029FFC] font-mono font-bold border border-[#029FFC]/40 text-xs">
                                      {sub.secretCode}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 italic">No code submitted</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {sub.proofUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewProofUrl(sub.proofUrl || null)}
                                      className="text-[#029FFC] font-semibold hover:underline flex items-center gap-1 text-[11px]"
                                    >
                                      <span>View Proof</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <span className="text-slate-500">N/A</span>
                                  )}
                                </td>
                                <td className="p-3 font-bold text-emerald-400">
                                  ₦{sub.rewardAmount.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      sub.status === 'approved'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : sub.status === 'rejected'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {sub.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {sub.status === 'pending' || sub.status === 'pending_verification' ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleApprove(sub)}
                                        disabled={processingSubId === sub.id}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-sm disabled:opacity-50"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRejectionModalSub(sub);
                                          setRejectionReason('');
                                        }}
                                        disabled={processingSubId === sub.id}
                                        className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>Reject</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-500 font-semibold">Processed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {filteredManualSubmissions.length > REVIEWS_PER_PAGE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#025BE5]/20 text-xs text-slate-400">
                          <div>
                            Showing <span className="text-white font-semibold">{(reviewPage - 1) * REVIEWS_PER_PAGE + 1}</span> to{' '}
                            <span className="text-white font-semibold">
                              {Math.min(reviewPage * REVIEWS_PER_PAGE, filteredManualSubmissions.length)}
                            </span>{' '}
                            of <span className="text-white font-semibold">{filteredManualSubmissions.length}</span> submissions
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={reviewPage === 1}
                              onClick={() => setReviewPage((prev) => Math.max(prev - 1, 1))}
                              className="px-3 py-1 bg-[#011438] hover:bg-[#025BE5]/20 border border-[#025BE5]/30 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              Previous
                            </button>
                            <span className="text-slate-300 font-semibold px-2">
                              Page {reviewPage} of {totalPages}
                            </span>
                            <button
                              type="button"
                              disabled={reviewPage >= totalPages}
                              onClick={() => setReviewPage((prev) => Math.min(prev + 1, totalPages))}
                              className="px-3 py-1 bg-[#011438] hover:bg-[#025BE5]/20 border border-[#025BE5]/30 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Creator Task Breakdown Table */}
            <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Your Published Tasks Breakdown</h3>
                  <p className="text-xs text-slate-400">Detailed overview of target state, gender, and spot completion</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30">
                    <tr>
                      <th className="p-3">Campaign Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Target Demographic</th>
                      <th className="p-3">Reward / Spot</th>
                      <th className="p-3">Spots Completed</th>
                      <th className="p-3">Escrow Budget</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#025BE5]/20 text-slate-300">
                    {tasks.map((t) => {
                      const pct = Math.round((t.completedSpots / t.totalSpots) * 100);
                      return (
                        <tr key={t.id} className="hover:bg-[#025BE5]/10">
                          <td className="p-3 font-semibold text-white max-w-xs truncate">
                            {t.title}
                          </td>
                          <td className="p-3 capitalize">
                            <span className="px-2 py-0.5 rounded bg-[#011438] border border-[#025BE5]/30 text-[10px]">
                              {t.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-0.5 text-[11px]">
                              <div className="flex items-center gap-1 text-[#029FFC]">
                                <MapPin className="w-3 h-3" />
                                <span>{t.targetState === 'All' ? 'All 36 States + FCT' : t.targetState}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-300">
                                <Users className="w-3 h-3" />
                                <span>{t.targetGender === 'All' ? 'All Genders' : t.targetGender}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-[#029FFC]">
                            ₦{t.rewardPerUser.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <span className="font-semibold">{t.completedSpots} / {t.totalSpots} ({pct}%)</span>
                              <div className="w-24 bg-[#011438] h-1.5 rounded-full overflow-hidden border border-[#025BE5]/20">
                                <div className="bg-gradient-to-r from-[#025BE5] to-[#029FFC] h-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-white">
                            ₦{t.totalBudget.toLocaleString()} <span className="text-[10px] text-slate-400">(+₦{t.creatorFeePaid} Fee)</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                t.status === 'active'
                                  ? 'bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </main>

      <Footer />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />

      {/* Rejection Reason Modal */}
      {rejectionModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#031F51] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-white">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <X className="w-5 h-5 text-red-400" />
                Reject Submission
              </h3>
              <button
                onClick={() => setRejectionModalSub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                You are rejecting submission for <strong className="text-white">{rejectionModalSub.taskTitle}</strong> by <strong className="text-[#029FFC]">{rejectionModalSub.userName}</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Rejection <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid secret code, screenshot does not show form submission confirmation..."
                  className="w-full p-3 rounded-xl bg-[#011438] border border-[#025BE5]/40 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectionModalSub(null)}
                disabled={isRejecting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Proof Screenshot Viewer Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#031F51] border border-[#025BE5]/40 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative text-white">
            <div className="flex items-center justify-between border-b border-[#025BE5]/20 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#029FFC]" />
                Tester Proof Screenshot Preview
              </h3>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl bg-[#011438] p-3 border border-[#025BE5]/20 flex items-center justify-center">
              {previewProofUrl.startsWith('data:image') || previewProofUrl.startsWith('http') ? (
                <img
                  src={previewProofUrl}
                  alt="Tester Proof Screenshot"
                  className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-300">
                  Proof Link: <a href={previewProofUrl} target="_blank" rel="noreferrer" className="text-[#029FFC] underline font-mono">{previewProofUrl}</a>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-1">
              <a
                href={previewProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#029FFC] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open in External Tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="px-4 py-2 bg-[#025BE5] hover:bg-[#0379FA] text-white font-bold rounded-xl text-xs shadow-md"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
