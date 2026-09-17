'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_WITHDRAWALS, INITIAL_TASKS, INITIAL_TRANSACTIONS } from '@/lib/store';
import { WithdrawalRequest, WithdrawalStatus } from '@/lib/types';
import { findBankByTag } from '@/lib/banks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Shield, Lock, Download, CheckCircle2, LogIn, FileSpreadsheet, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { user, role, isAuthenticated, openAuthModal } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [tasks] = useState(INITIAL_TASKS);
  const [transactions] = useState(INITIAL_TRANSACTIONS);
  const [isExporting, setIsExporting] = useState(false);

  // Compute platform fee earnings
  const creatorFeesTotal = transactions
    .filter((t) => t.type === 'creator_fee')
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawalFeesTotal = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.fee, 0);

  const totalPlatformEarnings = creatorFeesTotal + withdrawalFeesTotal;

  // Single item status switcher
  const handleUpdateStatus = (id: string, newStatus: WithdrawalStatus) => {
    const updated = withdrawals.map((w) =>
      w.id === id ? { ...w, status: newStatus, updatedAt: new Date().toISOString() } : w
    );
    setWithdrawals(updated);
  };

  // 1. Download Withdraw Requests (CSV) - ONLY PENDING requests
  const handleDownloadPendingCSV = async () => {
    const pendingRequests = withdrawals.filter((w) => w.status === 'PENDING');

    if (pendingRequests.length === 0) {
      alert('No PENDING withdrawal requests available to export.');
      return;
    }

    setIsExporting(true);

    try {
      // Build CSV matching ngn_amount_disburse_sample.csv format:
      // "Account Number","Bank","Amount","Narration"
      const csvHeader = '"Account Number","Bank","Amount","Narration"';
      const csvRows = pendingRequests.map((w) => {
        const tag = w.bankTag || findBankByTag(w.bankName || 'Opay').tag;
        const narration = `transfer to ${w.userName}`;
        return `"${w.accountNumber}","${tag}","${w.netAmount}","${narration}"`;
      });

      const csvString = [csvHeader, ...csvRows].join('\n');

      // Trigger Browser CSV Download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ngn_amount_disburse_pending_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Call Backend API to send email with CSV attachment via Resend API
      await fetch('/api/withdrawals/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingWithdrawals: pendingRequests }),
      });

      // Automatically update status of downloaded PENDING requests to PROCESSING
      const pendingIds = new Set(pendingRequests.map((p) => p.id));
      const updatedList = withdrawals.map((w) =>
        pendingIds.has(w.id) ? { ...w, status: 'PROCESSING' as WithdrawalStatus, updatedAt: new Date().toISOString() } : w
      );

      setWithdrawals(updatedList);
      alert(`Success! Downloaded ${pendingRequests.length} pending request(s) as CSV. Status changed to PROCESSING, and email attachment sent to admin.`);
    } catch (err: any) {
      console.error('[CSV Download Error]', err);
      alert(`Failed to complete CSV export: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Batch button to change ONLY PROCESSING requests to COMPLETED / PAID
  const handleMarkProcessingToPaid = () => {
    const processingRequests = withdrawals.filter((w) => w.status === 'PROCESSING');

    if (processingRequests.length === 0) {
      alert('No withdrawal requests currently in PROCESSING status.');
      return;
    }

    const updatedList = withdrawals.map((w) =>
      w.status === 'PROCESSING' ? { ...w, status: 'COMPLETED' as WithdrawalStatus, updatedAt: new Date().toISOString() } : w
    );

    setWithdrawals(updatedList);
    alert(`Marked ${processingRequests.length} PROCESSING request(s) as PAID / COMPLETED!`);
  };

  const chartData = [
    { name: 'Creator Fees Collected', amount: creatorFeesTotal, fill: '#025BE5' },
    { name: 'Withdrawal Fees Collected', amount: withdrawalFeesTotal, fill: '#0379FA' },
    { name: 'Total Platform Revenue', amount: totalPlatformEarnings, fill: '#029FFC' },
  ];

  const isAccessAllowed = isAuthenticated && role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-[#011438]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {!isAccessAllowed ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/40">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Suite Locked</h2>
            <p className="text-sm text-slate-300">
              Access to the platform revenue dashboard and withdrawal queue requires Master Admin authentication.
            </p>
            <button
              onClick={() => openAuthModal('admin')}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In as Admin</span>
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#025BE5]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-[#025BE5]/20 text-[#029FFC] text-xs font-bold uppercase tracking-wider border border-[#025BE5]/30">
                    Admin Control Room
                  </span>
                  <span className="text-xs text-slate-400">DataBounty Revenue & Payout Suite</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-7 h-7 text-[#029FFC]" />
                  Platform Revenue & Withdrawal Processing
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Download pending withdrawals CSV with bank tags and manage status workflow.
                </p>
              </div>

              {/* Secure Admin Email Pill */}
              <div className="p-3 bg-[#011438] border border-[#025BE5]/30 rounded-xl flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-[#029FFC] shrink-0" />
                <div>
                  <span className="text-[#029FFC] font-bold block">Admin Email Protected</span>
                  <code className="text-[11px] text-slate-300">{user?.email || 'admin@databounty.sampidia.com'}</code>
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="text-xs font-semibold text-slate-400">Total Platform Earnings</div>
                <div className="text-3xl font-black text-[#029FFC]">₦{totalPlatformEarnings.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">Creator fees + Withdrawal fees</p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="text-xs font-semibold text-slate-400">Creator Service Fees (₦50 / ₦100 / ₦500)</div>
                <div className="text-3xl font-black text-emerald-400">₦{creatorFeesTotal.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">Collected upon bounty publishing</p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="text-xs font-semibold text-slate-400">Withdrawal Cashout Fees (₦50 / ₦100)</div>
                <div className="text-3xl font-black text-amber-400">₦{withdrawalFeesTotal.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">Deducted on bank transfer execution</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
              <h3 className="text-base font-bold text-white">Platform Revenue Breakdown Chart</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#025BE5/20" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#011438', borderColor: '#025BE5', borderRadius: '12px', color: '#fff' }}
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

            {/* Withdrawal Queue Management Suite with Batch Action Buttons */}
            <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-5">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#025BE5]/20 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#029FFC]" />
                    Tester Withdrawal Requests Queue
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Download <code className="text-[#029FFC]">PENDING</code> requests as CSV &rarr; Auto-transitions to <code className="text-amber-400">PROCESSING</code> &rarr; Mark batch as <code className="text-emerald-400">COMPLETED</code>
                  </p>
                </div>

                {/* Batch Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownloadPendingCSV}
                    disabled={isExporting}
                    className="px-4 py-2 bg-gradient-to-r from-[#025BE5] to-[#0379FA] hover:opacity-95 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md shadow-[#025BE5]/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Generating CSV...' : 'Download Withdraw Requests (CSV)'}</span>
                  </button>

                  <button
                    onClick={handleMarkProcessingToPaid}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs transition-all border border-emerald-500/30 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Change All Processing to Paid/Completed</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30">
                    <tr>
                      <th className="p-3">Tester Name & Email</th>
                      <th className="p-3">Gross Cashout</th>
                      <th className="p-3">Fee Deducted</th>
                      <th className="p-3">Net Payout</th>
                      <th className="p-3">Bank Details & Tag</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3">Admin Status Switcher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#025BE5]/20 text-slate-300">
                    {withdrawals.map((w) => {
                      const currentTag = w.bankTag || findBankByTag(w.bankName || 'Opay').tag;
                      return (
                        <tr key={w.id} className="hover:bg-[#025BE5]/10">
                          <td className="p-3 font-semibold text-white">
                            <div>{w.userName}</div>
                            <div className="text-[10px] text-slate-400">{w.userEmail}</div>
                          </td>
                          <td className="p-3 font-bold text-white">₦{w.amount.toLocaleString()}</td>
                          <td className="p-3 font-semibold text-amber-400">₦{w.fee}</td>
                          <td className="p-3 font-black text-emerald-400">₦{w.netAmount.toLocaleString()}</td>
                          <td className="p-3">
                            <div className="text-[11px]">
                              <strong>{w.bankName}</strong>
                              <span className="text-[10px] ml-1 bg-[#025BE5]/20 text-[#029FFC] px-1.5 py-0.5 rounded font-mono border border-[#025BE5]/30">
                                Tag: {currentTag}
                              </span>
                              <div>Acct: <code className="text-[#029FFC] font-bold">{w.accountNumber}</code></div>
                              <div className="text-slate-400 text-[10px]">{w.accountName}</div>
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
                                  : 'bg-[#029FFC]/20 text-[#029FFC] border border-[#029FFC]/30'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(w.id, 'PROCESSING')}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-colors"
                              >
                                Processing
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(w.id, 'COMPLETED')}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(w.id, 'REJECTED')}
                                className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold border border-red-500/30 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
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
    </div>
  );
}
