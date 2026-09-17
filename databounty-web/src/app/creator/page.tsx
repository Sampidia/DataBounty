'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreateTaskModal from '@/components/CreateTaskModal';
import WithdrawModal from '@/components/WithdrawModal';
import { INITIAL_CREATOR, INITIAL_TASKS, INITIAL_SUBMISSIONS } from '@/lib/store';
import { UserRole, BountyTask } from '@/lib/types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { BarChart3, PlusCircle, Wallet, CheckCircle2, Clock, XCircle, Users, MapPin, Sparkles, FileSpreadsheet } from 'lucide-react';

export default function CreatorDashboard() {
  const [userRole, setUserRole] = useState<UserRole>('creator');
  const [creatorUser, setCreatorUser] = useState(INITIAL_CREATOR);
  const [tasks, setTasks] = useState<BountyTask[]>(INITIAL_TASKS);
  const [submissions] = useState(INITIAL_SUBMISSIONS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    { name: 'Completed Tasks', value: completedTasksCount, color: '#10b981' },
    { name: 'Active In-Progress Tasks', value: activeTasksCount, color: '#06b6d4' },
  ];

  const funnelData = [
    { name: 'Approved', count: approvedSubmissions, fill: '#10b981' },
    { name: 'Pending Review', count: pendingSubmissions, fill: '#f59e0b' },
    { name: 'Rejected', count: rejectedSubmissions, fill: '#ef4444' },
  ];

  const handleTaskCreated = (newTask: BountyTask) => {
    setTasks([newTask, ...tasks]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Navbar
        currentRole={userRole}
        setRole={setUserRole}
        walletBalance={creatorUser.walletBalance}
        openCreateTaskModal={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                Creator Suite
              </span>
              <span className="text-xs text-gray-400">TechCraft Studios Nigeria</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              Creator Analytics & Campaign Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Monitor active task completion progress, submission funnels, and demographic targeting.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-extrabold px-5 py-3 rounded-xl shadow-lg glow-emerald transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Publish New Bounty Task</span>
          </button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
              <span>Active Tasks</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{activeTasksCount} Tasks</div>
            <p className="text-[11px] text-gray-400">Total {tasks.length} campaigns published</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
              <span>Total Escrow Budget</span>
              <Wallet className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">₦{totalEscrowDeposited.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400">Includes creator service fees</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
              <span>Total Rewards Paid</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400">₦{totalRewardsPaid.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400">{approvedSubmissions} approved payouts</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="flex justify-between items-center text-gray-400 text-xs font-semibold">
              <span>Available Wallet Balance</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">₦{creatorUser.walletBalance.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400">Ready for next campaign</p>
          </div>
        </div>

        {/* Visual Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Donut Chart - Completed vs Uncompleted Tasks */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Campaign Progress Breakdown</h3>
              <p className="text-xs text-gray-400">Completed vs. Active In-Progress Bounties</p>
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
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Submissions Funnel Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Submissions Review Funnel</h3>
              <p className="text-xs text-gray-400">Breakdown of total tester submissions received</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
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
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Your Published Tasks Breakdown</h3>
              <p className="text-xs text-gray-400">Detailed overview of target state, gender, and spot completion</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
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
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {tasks.map((t) => {
                  const pct = Math.round((t.completedSpots / t.totalSpots) * 100);
                  return (
                    <tr key={t.id} className="hover:bg-gray-900/50">
                      <td className="p-3 font-semibold text-white max-w-xs truncate">
                        {t.title}
                      </td>
                      <td className="p-3 capitalize">
                        <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px]">
                          {t.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-emerald-400">
                            <MapPin className="w-3 h-3" />
                            <span>{t.targetState === 'All' ? 'All 36 States + FCT' : t.targetState}</span>
                          </div>
                          <div className="flex items-center gap-1 text-teal-300">
                            <Users className="w-3 h-3" />
                            <span>{t.targetGender === 'All' ? 'All Genders' : t.targetGender}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-emerald-400">
                        ₦{t.rewardPerUser.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <span className="font-semibold">{t.completedSpots} / {t.totalSpots} ({pct}%)</span>
                          <div className="w-24 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        ₦{t.totalBudget.toLocaleString()} <span className="text-[10px] text-gray-400">(+₦{t.creatorFeePaid} Fee)</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-gray-800 text-gray-400'
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

      </main>

      <Footer />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
