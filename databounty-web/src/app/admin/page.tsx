'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { INITIAL_WITHDRAWALS, INITIAL_TASKS, INITIAL_TRANSACTIONS } from '@/lib/store';
import { UserRole, WithdrawalRequest, WithdrawalStatus } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Shield, Lock, Wallet, CheckCircle2, Clock, XCircle, DollarSign, Mail, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [tasks] = useState(INITIAL_TASKS);
  const [transactions] = useState(INITIAL_TRANSACTIONS);

  // Compute platform fee earnings
  const creatorFeesTotal = transactions
    .filter((t) => t.type === 'creator_fee')
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawalFeesTotal = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.fee, 0);

  const totalPlatformEarnings = creatorFeesTotal + withdrawalFeesTotal;

  // Status Switcher handler for Admin
  const handleUpdateStatus = (id: string, newStatus: WithdrawalStatus) => {
    const updated = withdrawals.map((w) =>
      w.id === id ? { ...w, status: newStatus, updatedAt: new Date().toISOString() } : w
    );
    setWithdrawals(updated);
  };

  const chartData = [
    { name: 'Creator Fees Collected', amount: creatorFeesTotal, fill: '#10b981' },
    { name: 'Withdrawal Fees Collected', amount: withdrawalFeesTotal, fill: '#f59e0b' },
    { name: 'Total Platform Revenue', amount: totalPlatformEarnings, fill: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Navbar
        currentRole={userRole}
        setRole={setUserRole}
        walletBalance={1250000}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                Admin Control Room
              </span>
              <span className="text-xs text-gray-400">DataBounty Revenue & Payout Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-7 h-7 text-purple-400" />
              Platform Revenue & Withdrawal Processing
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Manage cashout queue status transitions and monitor platform transaction service fees.
            </p>
          </div>

          {/* Secure Admin Email Pill */}
          <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-purple-300 font-bold block">Admin Email Protected</span>
              <code className="text-[11px] text-gray-300">process.env.ADMIN_EMAIL</code>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="text-xs font-semibold text-gray-400">Total Platform Earnings</div>
            <div className="text-3xl font-black text-purple-400">₦{totalPlatformEarnings.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400">Creator fees + Withdrawal fees</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="text-xs font-semibold text-gray-400">Creator Service Fees (₦50 / ₦100 / ₦500)</div>
            <div className="text-3xl font-black text-emerald-400">₦{creatorFeesTotal.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400">Collected upon bounty publishing</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-gray-800 space-y-2">
            <div className="text-xs font-semibold text-gray-400">Withdrawal Cashout Fees (₦50 / ₦100)</div>
            <div className="text-3xl font-black text-amber-400">₦{withdrawalFeesTotal.toLocaleString()}</div>
            <p className="text-[11px] text-gray-400">Deducted on bank transfer execution</p>
          </div>
        </div>

        {/* Platform Revenue Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white">Platform Revenue Breakdown Chart</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Withdrawal Queue Management Table */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Tester Withdrawal Requests Queue</h3>
              <p className="text-xs text-gray-400">
                Switch status from <code>PENDING</code> &rarr; <code>PROCESSING</code> &rarr; <code>COMPLETED</code>
              </p>
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              {withdrawals.length} Requests Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3">Tester Name & Email</th>
                  <th className="p-3">Gross Cashout</th>
                  <th className="p-3">Fee Deducted</th>
                  <th className="p-3">Net Payout</th>
                  <th className="p-3">Paystack Bank Details</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3">Admin Status Switcher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-900/50">
                    <td className="p-3 font-semibold text-white">
                      <div>{w.userName}</div>
                      <div className="text-[10px] text-gray-400">{w.userEmail}</div>
                    </td>
                    <td className="p-3 font-bold text-white">₦{w.amount.toLocaleString()}</td>
                    <td className="p-3 font-semibold text-amber-400">₦{w.fee}</td>
                    <td className="p-3 font-black text-emerald-400">₦{w.netAmount.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="text-[11px]">
                        <strong>{w.bankName}</strong>
                        <div>Acct: <code className="text-emerald-300">{w.accountNumber}</code></div>
                        <div className="text-gray-400 text-[10px]">{w.accountName}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : w.status === 'PROCESSING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : w.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'PROCESSING')}
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30"
                        >
                          Processing
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'COMPLETED')}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'REJECTED')}
                          className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold border border-red-500/30"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
