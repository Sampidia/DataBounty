'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateTaskModal from '@/components/CreateTaskModal';
import { TopUpModal } from '@/components/TopUpModal';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_SUBMISSIONS } from '@/lib/store';
import { BountyTask } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { BarChart3, PlusCircle, Wallet, CheckCircle2, Clock, Users, MapPin, Sparkles, LogIn, Lock } from 'lucide-react';

export default function CreatorDashboard() {
  const { user, role, isAuthenticated, openAuthModal, updateUser } = useAuth();
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [submissions] = useState(INITIAL_SUBMISSIONS);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // Fetch creator's tasks from Firestore
  useEffect(() => {
    if (user?.id) {
      setIsLoadingTasks(true);
      const fetchCreatorTasks = async () => {
        try {
          const tasksRef = collection(db, 'tasks');
          const q = query(tasksRef, where('creatorId', '==', user.id));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BountyTask));
            setTasks(loaded);
          } else {
            setTasks([]);
          }
        } catch (err) {
          console.warn('[CreatorDashboard] Firestore fetch error:', err);
        } finally {
          setIsLoadingTasks(false);
        }
      };
      fetchCreatorTasks();
    }
  }, [user?.id]);

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
                  Creator Analytics & Campaign Dashboard
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
                  + Top Up Balance via Flutterwave
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
    </div>
  );
}
