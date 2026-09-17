'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_WITHDRAWALS, INITIAL_TRANSACTIONS } from '@/lib/store';
import { WithdrawalRequest, WithdrawalStatus } from '@/lib/types';
import { findBankByTag } from '@/lib/banks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Shield, Lock, Download, CheckCircle2, FileSpreadsheet, Mail, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminDashboardClient() {
  const { isAdminAuthenticated, setAdminAuthenticated } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [transactions] = useState(INITIAL_TRANSACTIONS);
  
  // OTP Form State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
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

  // Request OTP Email Dispatch
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP code');
      }

      setOtpStep('otp');
      setInfoMsg(data.message || `OTP verification code sent to ${email}`);
      if (data.devModeCode) {
        setInfoMsg(`[Development Mode Code: ${data.devModeCode}] Code sent to ${email}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      setAdminAuthenticated(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Export
  const handleDownloadPendingCSV = async () => {
    const pendingRequests = withdrawals.filter((w) => w.status === 'PENDING');

    if (pendingRequests.length === 0) {
      alert('No PENDING withdrawal requests available to export.');
      return;
    }

    setIsExporting(true);

    try {
      const csvHeader = '"Account Number","Bank","Amount","Narration"';
      const csvRows = pendingRequests.map((w) => {
        const tag = w.bankTag || findBankByTag(w.bankName || 'Opay').tag;
        const narration = `transfer to ${w.userName}`;
        return `"${w.accountNumber}","${tag}","${w.netAmount}","${narration}"`;
      });

      const csvString = [csvHeader, ...csvRows].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ngn_amount_disburse_pending_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await fetch('/api/withdrawals/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingWithdrawals: pendingRequests }),
      });

      const pendingIds = new Set(pendingRequests.map((p) => p.id));
      const updatedList = withdrawals.map((w) =>
        pendingIds.has(w.id) ? { ...w, status: 'PROCESSING' as WithdrawalStatus, updatedAt: new Date().toISOString() } : w
      );

      setWithdrawals(updatedList);
      alert(`Success! Downloaded ${pendingRequests.length} pending request(s) as CSV.`);
    } catch (err: any) {
      alert(`Failed to complete CSV export: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

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
    { name: 'Creator Fees', amount: creatorFeesTotal, fill: '#025BE5' },
    { name: 'Withdrawal Fees', amount: withdrawalFeesTotal, fill: '#0379FA' },
    { name: 'Total Revenue', amount: totalPlatformEarnings, fill: '#029FFC' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#011438]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {!isAdminAuthenticated ? (
          <div className="max-w-md mx-auto my-12 p-8 bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl text-white space-y-6">
            
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/40 mb-2">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Restricted Master Admin Suite</h2>
              <p className="text-xs text-slate-300">
                Access is restricted strictly to the designated <strong className="text-[#029FFC]">Admin</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="p-3 bg-[#025BE5]/20 border border-[#025BE5]/40 rounded-xl flex items-start gap-2 text-xs text-[#029FFC]">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            {otpStep === 'email' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Master Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="support@databounty.sampidia.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 text-xs transition-all"
                >
                  {isLoading ? 'Dispatching OTP Code...' : 'Send OTP Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white font-mono tracking-widest focus:outline-none focus:border-[#029FFC]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 text-xs transition-all"
                >
                  {isLoading ? 'Verifying...' : 'Unlock Admin Suite'}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpStep('email')}
                  className="w-full text-center text-xs text-slate-400 hover:text-white"
                >
                  Change Email Address
                </button>
              </form>
            )}

          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#025BE5]/20 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-[#025BE5]/20 text-[#029FFC] text-xs font-bold uppercase tracking-wider border border-[#025BE5]/30">
                    Admin Control Suite (`/data`)
                  </span>
                  <span className="text-xs text-slate-400">Master Revenue & Withdrawal Queue</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-7 h-7 text-[#029FFC]" />
                  Platform Revenue & Withdrawal Processing
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAdminAuthenticated(false)}
                  className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-xl text-xs border border-red-500/30 transition-all"
                >
                  Lock Admin Session
                </button>
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
                <div className="text-xs font-semibold text-slate-400">Creator Service Fees</div>
                <div className="text-3xl font-black text-emerald-400">₦{creatorFeesTotal.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">Collected upon bounty publishing</p>
              </div>

              <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                <div className="text-xs font-semibold text-slate-400">Withdrawal Cashout Fees</div>
                <div className="text-3xl font-black text-amber-400">₦{withdrawalFeesTotal.toLocaleString()}</div>
                <p className="text-[11px] text-slate-400">Deducted on bank transfer execution</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
              <h3 className="text-base font-bold text-white">Platform Revenue Breakdown</h3>
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

            {/* Withdrawal Queue Table */}
            <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#025BE5]/20 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#029FFC]" />
                    Tester Withdrawal Requests Queue
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleDownloadPendingCSV}
                    disabled={isExporting}
                    className="px-4 py-2 bg-gradient-to-r from-[#025BE5] to-[#0379FA] hover:opacity-95 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Exporting...' : 'Download Withdraw Requests (CSV)'}</span>
                  </button>

                  <button
                    onClick={handleMarkProcessingToPaid}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs transition-all border border-emerald-500/30 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Mark Processing to Paid</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30">
                    <tr>
                      <th className="p-3">Tester Details</th>
                      <th className="p-3">Gross</th>
                      <th className="p-3">Fee</th>
                      <th className="p-3">Net Payout</th>
                      <th className="p-3">Bank Details</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Action</th>
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
                              <span className="text-[10px] ml-1 bg-[#025BE5]/20 text-[#029FFC] px-1.5 py-0.5 rounded font-mono">
                                Tag: {currentTag}
                              </span>
                              <div>Acct: <code className="text-[#029FFC] font-bold">{w.accountNumber}</code></div>
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
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30"
                              >
                                Processing
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(w.id, 'COMPLETED')}
                                className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30"
                              >
                                Paid
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
