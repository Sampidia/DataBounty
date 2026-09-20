'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_WITHDRAWALS, INITIAL_TRANSACTIONS } from '@/lib/store';
import { WithdrawalRequest, WithdrawalStatus, UserProfile } from '@/lib/types';
import { findBankByTag } from '@/lib/banks';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Shield, Lock, Download, CheckCircle2, FileSpreadsheet, Mail, KeyRound, AlertCircle,
  Sparkles, RefreshCw, Users, UserX, UserCheck, Send, Search, ChevronDown, BarChart3,
} from 'lucide-react';
import { auth } from '@/lib/firebase';

type AdminTab = 'revenue' | 'users' | 'email';

export default function AdminDashboardClient() {
  const { isAdminAuthenticated, setAdminAuthenticated } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [transactions] = useState(INITIAL_TRANSACTIONS);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('revenue');

  // OTP Form State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // User Accounts Tab State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Email Dispatcher Tab State
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrom] = useState('support@databounty.sampidia.com');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch withdrawal requests from Server API
  const fetchWithdrawals = async () => {
    setIsFetching(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/withdrawals/list', {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.withdrawals)) {
        setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Fetch withdrawals error:', err);
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch all user accounts
  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users/list', {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Fetch users error:', err);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchWithdrawals();
      fetchUsers();
    }
  }, [isAdminAuthenticated]);

  // Toggle user account status
  const handleToggleUserStatus = async (userId: string, currentStatus: 'active' | 'suspended' | undefined) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setTogglingUserId(userId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user status');
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err: any) {
      console.error('[AdminDashboard] User status toggle error:', err);
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setTogglingUserId(null);
    }
  };

  // Filtered users by search
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status !== 'suspended').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

  // Send custom email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailResult(null);
    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          from: emailFrom,
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }
      setEmailResult({ type: 'success', message: `Email sent successfully to ${emailTo}.` });
      setEmailTo('');
      setEmailSubject('');
      setEmailMessage('');
    } catch (err: any) {
      setEmailResult({ type: 'error', message: err.message || 'An error occurred.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Compute platform fee earnings
  const creatorFeesTotal = transactions
    .filter((t) => t.type === 'creator_fee')
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawalFeesTotal = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.fee, 0);

  const totalPlatformEarnings = creatorFeesTotal + withdrawalFeesTotal;

  // Single item status switcher
  const handleUpdateStatus = async (id: string, newStatus: WithdrawalStatus) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/withdrawals/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId: id, status: newStatus, idToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update withdrawal status');
      }

      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: newStatus, updatedAt: new Date().toISOString() } : w
        )
      );
    } catch (err: any) {
      console.error('[AdminDashboard] Status update error:', err);
      alert(`Failed to update status: ${err.message}`);
    }
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

      const pendingIds = pendingRequests.map((p) => p.id);
      const idToken = await auth.currentUser?.getIdToken();

      await fetch('/api/withdrawals/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingWithdrawals: pendingRequests }),
      });

      const statusRes = await fetch('/api/admin/withdrawals/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalIds: pendingIds, status: 'PROCESSING', idToken }),
      });
      const statusData = await statusRes.json();
      if (!statusRes.ok || !statusData.success) {
        console.warn('[AdminDashboard] CSV export status update warning:', statusData.error);
      }

      const pendingSet = new Set(pendingIds);
      setWithdrawals((prev) =>
        prev.map((w) =>
          pendingSet.has(w.id) ? { ...w, status: 'PROCESSING' as WithdrawalStatus, updatedAt: new Date().toISOString() } : w
        )
      );

      alert(`Success! Downloaded ${pendingRequests.length} pending request(s) as CSV.`);
    } catch (err: any) {
      alert(`Failed to complete CSV export: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkProcessingToPaid = async () => {
    const processingRequests = withdrawals.filter((w) => w.status === 'PROCESSING');

    if (processingRequests.length === 0) {
      alert('No withdrawal requests currently in PROCESSING status.');
      return;
    }

    try {
      const processingIds = processingRequests.map((p) => p.id);
      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch('/api/admin/withdrawals/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalIds: processingIds, status: 'COMPLETED', idToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update processing withdrawals to paid');
      }

      const processingSet = new Set(processingIds);
      setWithdrawals((prev) =>
        prev.map((w) =>
          processingSet.has(w.id) ? { ...w, status: 'COMPLETED' as WithdrawalStatus, updatedAt: new Date().toISOString() } : w
        )
      );

      alert(`Marked ${processingRequests.length} PROCESSING request(s) as PAID / COMPLETED!`);
    } catch (err: any) {
      alert(`Failed to mark requests as paid: ${err.message}`);
    }
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
                      placeholder="admin@example.com"
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
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-7 h-7 text-[#029FFC]" />
                  DataBounty Master Admin
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { fetchWithdrawals(); fetchUsers(); }}
                  disabled={isFetching || isFetchingUsers}
                  className="px-3.5 py-2 bg-[#025BE5]/20 hover:bg-[#025BE5]/30 text-[#029FFC] font-bold rounded-xl text-xs border border-[#025BE5]/30 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${(isFetching || isFetchingUsers) ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setAdminAuthenticated(false)}
                  className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold rounded-xl text-xs border border-red-500/30 transition-all"
                >
                  Lock Admin Session
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1.5 p-1.5 bg-[#031F51] border border-[#025BE5]/25 rounded-2xl w-fit">
              {([
                { id: 'revenue', label: 'Revenue & Withdrawals', icon: BarChart3 },
                { id: 'users', label: 'User Accounts', icon: Users },
                { id: 'email', label: 'Email Dispatcher', icon: Send },
              ] as { id: AdminTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveAdminTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeAdminTab === id
                      ? 'bg-gradient-to-r from-[#025BE5] to-[#0379FA] text-white shadow-md shadow-[#025BE5]/20'
                      : 'text-slate-400 hover:text-white hover:bg-[#025BE5]/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* ═══════════════════════════ TAB: REVENUE & WITHDRAWALS ═══════════════════════════ */}
            {activeAdminTab === 'revenue' && (
              <>
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

            {/* ═══════════════════════════ TAB: USER ACCOUNTS ═══════════════════════════ */}
            {activeAdminTab === 'users' && (
              <>
                {/* User Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="glass-card p-5 rounded-2xl border border-[#025BE5]/25 space-y-2">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Total Users
                    </div>
                    <div className="text-3xl font-black text-white">{totalUsers}</div>
                    <p className="text-[11px] text-slate-400">Testers & Creators combined</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 space-y-2">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Accounts
                    </div>
                    <div className="text-3xl font-black text-emerald-400">{activeUsers}</div>
                    <p className="text-[11px] text-slate-400">Accounts with full platform access</p>
                  </div>

                  <div className="glass-card p-5 rounded-2xl border border-red-500/20 space-y-2">
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5 text-red-400" /> Suspended Accounts
                    </div>
                    <div className="text-3xl font-black text-red-400">{suspendedUsers}</div>
                    <p className="text-[11px] text-slate-400">Login blocked accounts</p>
                  </div>
                </div>

                {/* User Table Panel */}
                <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#029FFC]" />
                      All Registered Users
                    </h3>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] transition-all"
                      />
                    </div>
                  </div>

                  {isFetchingUsers ? (
                    <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30">
                          <tr>
                            <th className="p-3">User Details</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Wallet Balance</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#025BE5]/20 text-slate-300">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500">
                                {userSearch ? 'No users match your search.' : 'No registered users found.'}
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => {
                              const isSuspended = u.status === 'suspended';
                              const isToggling = togglingUserId === u.id;
                              return (
                                <tr key={u.id} className="hover:bg-[#025BE5]/10 transition-colors">
                                  <td className="p-3">
                                    <div className="font-semibold text-white">{u.name}</div>
                                    <div className="text-[10px] text-slate-400">{u.email}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                      u.role === 'creator'
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                        : 'bg-[#025BE5]/20 text-[#029FFC] border-[#025BE5]/30'
                                    }`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="p-3 font-bold text-emerald-400">
                                    ₦{(u.walletBalance ?? 0).toLocaleString()}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                      isSuspended
                                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    }`}>
                                      {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {isSuspended ? (
                                      <button
                                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                                        disabled={isToggling}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
                                      >
                                        <UserCheck className="w-3 h-3" />
                                        {isToggling ? 'Activating...' : 'Activate Account'}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                                        disabled={isToggling}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold border border-red-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
                                      >
                                        <UserX className="w-3 h-3" />
                                        {isToggling ? 'Suspending...' : 'Suspend Account'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ═══════════════════════════ TAB: EMAIL DISPATCHER ═══════════════════════════ */}
            {activeAdminTab === 'email' && (
              <div className="max-w-2xl space-y-6">

                {/* Info Banner */}
                <div className="p-4 bg-[#025BE5]/10 border border-[#025BE5]/25 rounded-2xl flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#029FFC] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">Admin Email Dispatcher</p>
                    <p className="text-xs text-slate-400">
                      Send branded DataBounty emails to any recipient using the authorized sender addresses.
                      Emails are delivered via the Resend API using a premium HTML template.
                    </p>
                  </div>
                </div>

                {/* Result Banner */}
                {emailResult && (
                  <div className={`p-3 rounded-xl flex items-start gap-2 text-xs border ${
                    emailResult.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    {emailResult.type === 'success'
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    }
                    <span>{emailResult.message}</span>
                  </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleSendEmail} className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-5">
                  {/* To */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      To (Recipient Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] transition-all"
                      />
                    </div>
                  </div>

                  {/* From */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      From (Sender Address)
                    </label>
                    <div className="relative">
                      <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      <select
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white focus:outline-none focus:border-[#029FFC] transition-all appearance-none"
                      >
                        <option value="support@databounty.sampidia.com">
                          support@databounty.sampidia.com
                        </option>
                        <option value="alerts@databounty.sampidia.com">
                          alerts@databounty.sampidia.com
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Important update from DataBounty"
                      className="w-full px-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      required
                      rows={8}
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Write your message here..."
                      className="w-full px-4 py-3 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/25 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    {isSendingEmail ? 'Sending Email...' : 'Send Custom Email'}
                  </button>
                </form>
              </div>
            )}

          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
