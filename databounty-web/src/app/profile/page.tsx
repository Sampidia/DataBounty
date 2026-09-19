'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WithdrawModal from '@/components/WithdrawModal';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_TRANSACTIONS } from '@/lib/store';
import { NIGERIAN_STATES, Transaction } from '@/lib/types';
import { POPULAR_NIGERIAN_BANKS } from '@/lib/banks';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User, Wallet, ShieldCheck, CheckCircle2, Save, ArrowDownRight, ArrowUpRight, Smartphone, LogIn, Lock, CreditCard, RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, openAuthModal, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'payouts' | 'withdrawals'>('all');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(user?.gender || 'Male');
  const [state, setState] = useState(user?.state || 'Lagos');
  const [deviceBrand, setDeviceBrand] = useState(user?.deviceBrand || 'Tecno');
  const [deviceModel, setDeviceModel] = useState(user?.deviceModel || 'Camon 20');
  const [osVersion, setOsVersion] = useState(user?.osVersion || 'Android 13');

  // Bank / Payment Form State
  const [bankName, setBankName] = useState(user?.bankName || 'Opay');
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.accountName || '');
  const [isResolvingBank, setIsResolvingBank] = useState(false);
  const [bankVerified, setBankVerified] = useState(!!user?.accountName && user.accountName !== 'GUEST');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setGender(user.gender);
      setState(user.state);
      setDeviceBrand(user.deviceBrand);
      setDeviceModel(user.deviceModel);
      setOsVersion(user.osVersion);
      setBankName(user.bankName || 'Opay');
      setAccountNumber(user.accountNumber || '');
      setAccountName(user.accountName || '');
      if (user.accountName && user.accountName !== 'GUEST') {
        setBankVerified(true);
      }
    }
  }, [user]);

  // Fetch real-time approved submissions (payouts) & withdrawals from Firestore
  useEffect(() => {
    if (user?.id) {
      const subsRef = collection(db, 'submissions');
      const qSubs = query(subsRef, where('userId', '==', user.id), where('status', '==', 'approved'));

      const wdsRef = collection(db, 'withdrawals');
      const qWds = query(wdsRef, where('userId', '==', user.id));

      let loadedPayouts: Transaction[] = [];
      let loadedWithdrawals: Transaction[] = [];

      const unsubSubs = onSnapshot(qSubs, (snap) => {
        loadedPayouts = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: user.id,
            userName: user.name,
            type: 'task_reward',
            amount: data.rewardAmount || 0,
            description: `Task Bounty Reward: ${data.taskTitle || 'Bounty Campaign'}`,
            timestamp: data.verifiedAt || data.submittedAt || new Date().toISOString(),
          } as Transaction;
        });
        updateCombinedTransactions();
      });

      const unsubWds = onSnapshot(qWds, (snap) => {
        loadedWithdrawals = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: user.id,
            userName: user.name,
            type: 'withdrawal',
            amount: data.amount || 0,
            description: `Bank Cashout to ${data.bankName || 'NUBAN'} (${data.accountNumber || ''})`,
            status: data.status || 'PENDING',
            timestamp: data.requestedAt || new Date().toISOString(),
          } as Transaction;
        });
        updateCombinedTransactions();
      });

      function updateCombinedTransactions() {
        const combined = [...loadedPayouts, ...loadedWithdrawals];
        combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTransactions(combined);
      }

      return () => {
        unsubSubs();
        unsubWds();
      };
    }
  }, [user?.id]);

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'payouts') return tx.type === 'task_reward';
    if (activeTab === 'withdrawals') return tx.type === 'withdrawal';
    return true;
  });

  const handleResolveBank = async () => {
    if (!bankName || accountNumber.length < 10) {
      alert('Please select a bank and enter a 10-digit account number.');
      return;
    }
    setIsResolvingBank(true);
    try {
      const res = await fetch('/api/bank/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber }),
      });
      const data = await res.json();
      if (data.success && data.accountName) {
        setAccountName(data.accountName);
        setBankVerified(true);
      } else {
        alert(`Account resolution failed: ${data.error || 'Check bank & account number'}`);
      }
    } catch (err: any) {
      alert(`Resolution error: ${err.message}`);
    } finally {
      setIsResolvingBank(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      phone,
      gender,
      state,
      deviceBrand,
      deviceModel,
      osVersion,
      bankName,
      accountNumber,
      accountName,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#011438]">
      <Navbar openWithdrawModal={() => setIsWithdrawModalOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl text-center space-y-4 text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/40">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Profile & Wallet Locked</h2>
            <p className="text-sm text-slate-300">
              Please log in to view your profile settings, device specs, and payout transactions.
            </p>
            <button
              onClick={() => openAuthModal('tester')}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Account</span>
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-[#025BE5]/20 pb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <User className="w-7 h-7 text-[#029FFC]" />
                Profile &amp; Wallet Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Manage your personal demographic details, bank account, and withdrawal funds.
              </p>
            </div>

            {/* Top Row: Wallet Card & Quick Cashout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Wallet Balance Card */}
              <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-[#025BE5]/30 space-y-5 bg-gradient-to-tr from-[#031F51] via-[#011438] to-[#025BE5]/20">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#029FFC]" />
                    Wallet Balance
                  </span>
                  <span className="bg-[#025BE5]/20 text-[#029FFC] text-[10px] px-2 py-0.5 rounded font-bold border border-[#025BE5]/30">
                    NGN 🇳🇬
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-black text-white">₦{(user?.walletBalance || 0).toLocaleString()}</div>
                  <p className="text-xs text-slate-400">Available for instant bank payout</p>
                </div>

                <div className="pt-2 border-t border-[#025BE5]/20 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Minimum Cashout Threshold:</span>
                    <strong className="text-[#029FFC]">₦100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawal Fee Tier (&lt;₦10k):</span>
                    <strong className="text-amber-400">₦50 Fee</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawal Fee Tier (&ge;₦10k):</span>
                    <strong className="text-amber-400">₦100 Fee</strong>
                  </div>
                </div>

                <button
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-black rounded-xl text-xs shadow-lg shadow-[#025BE5]/30 transition-all"
                >
                  Request Bank Withdrawal
                </button>
              </div>

              {/* User Profile Form */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-6">
                <div className="flex items-center justify-between border-b border-[#025BE5]/20 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#029FFC]" />
                    Demographic Profile & Device Specs
                  </h3>
                  {isSaved && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Profile Updated!
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (+234)</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                        className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        State of Residency Target (36 States + FCT)
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                      >
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s} State
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Device Spec Section */}
                  <div className="pt-3 border-t border-[#025BE5]/20 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#029FFC]" />
                      Captured Testing Device Specifications
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Device Brand</label>
                        <input
                          type="text"
                          value={deviceBrand}
                          onChange={(e) => setDeviceBrand(e.target.value)}
                          className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Device Model</label>
                        <input
                          type="text"
                          value={deviceModel}
                          onChange={(e) => setDeviceModel(e.target.value)}
                          className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Android OS Version</label>
                        <input
                          type="text"
                          value={osVersion}
                          onChange={(e) => setOsVersion(e.target.value)}
                          className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank & Payment Details Section */}
                  <div className="pt-3 border-t border-[#025BE5]/20 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#029FFC]" />
                      Withdrawal Payout Bank Account
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Select Bank</label>
                        <select
                          value={bankName}
                          onChange={(e) => {
                            setBankName(e.target.value);
                            setBankVerified(false);
                            setAccountName('');
                          }}
                          className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                        >
                          {POPULAR_NIGERIAN_BANKS.map((b) => (
                            <option key={b.code} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">10-Digit NUBAN Account Number</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={10}
                            value={accountNumber}
                            onChange={(e) => {
                              setAccountNumber(e.target.value);
                              setBankVerified(false);
                              setAccountName('');
                            }}
                            placeholder="0123456789"
                            className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                          />
                          <button
                            type="button"
                            onClick={handleResolveBank}
                            disabled={isResolvingBank || accountNumber.length < 10}
                            className="px-3 py-1.5 bg-[#025BE5]/20 hover:bg-[#025BE5]/30 border border-[#025BE5]/40 text-[#029FFC] font-bold text-xs rounded-lg whitespace-nowrap disabled:opacity-40 flex items-center gap-1"
                          >
                            {isResolvingBank ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : bankVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {accountName && (
                      <div className="p-2.5 bg-[#011438] border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
                        <span className="text-slate-400">Account Name:</span>
                        <strong className="text-emerald-400 font-bold">{accountName}</strong>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-[#025BE5] to-[#0379FA] hover:opacity-95 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md shadow-[#025BE5]/20"
                    >
                      <Save className="w-4 h-4" />
                      Save Profile Changes
                    </button>
                  </div>

                </form>
              </div>

            </div>

            {/* Transaction History Table */}
            <div className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#025BE5]/20 pb-3">
                <h3 className="text-base font-bold text-white">Recent Wallet Activity &amp; Payout History</h3>

                {/* Activity Tabs */}
                <div className="flex items-center gap-1.5 bg-[#011438] p-1 rounded-xl border border-[#025BE5]/30 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'all'
                        ? 'bg-[#025BE5] text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Activity ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('payouts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'payouts'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Task Payouts ({transactions.filter((t) => t.type === 'task_reward').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('withdrawals')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'withdrawals'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bank Withdrawals ({transactions.filter((t) => t.type === 'withdrawal').length})
                  </button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center bg-[#011438] rounded-xl border border-[#025BE5]/20 text-slate-400 text-xs">
                  No activity history recorded under {activeTab === 'all' ? 'this account' : activeTab}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30">
                      <tr>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#025BE5]/20 text-slate-300">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#025BE5]/10">
                          <td className="p-3">
                            {tx.type === 'task_reward' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                <ArrowDownRight className="w-3 h-3 text-emerald-400" /> Task Reward
                              </span>
                            )}
                            {tx.type === 'withdrawal' && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                <ArrowUpRight className="w-3 h-3 text-amber-400" /> Bank Cashout
                              </span>
                            )}
                            {tx.type === 'creator_fee' && (
                              <span className="px-2 py-0.5 rounded bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30 text-[10px] font-bold w-max block">
                                Creator Fee
                              </span>
                            )}
                            {tx.type === 'escrow_deposit' && (
                              <span className="px-2 py-0.5 rounded bg-[#0379FA]/20 text-blue-300 border border-[#0379FA]/30 text-[10px] font-bold w-max block">
                                Escrow Deposit
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-200">{tx.description}</td>
                          <td className={`p-3 font-bold ${tx.type === 'task_reward' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {tx.type === 'task_reward' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                          </td>
                          <td className="p-3">
                            {tx.type === 'withdrawal' ? (
                              tx.status === 'COMPLETED' ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                  ✅ Paid
                                </span>
                              ) : tx.status === 'PROCESSING' ? (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                  🔄 Processing
                                </span>
                              ) : tx.status === 'REJECTED' ? (
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                  ❌ Rejected
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                  ⏱ Pending
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                ✅ Paid
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </main>

      <Footer />

      {user && (
        <WithdrawModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          user={user}
          onWithdrawSubmitted={async (wd) => {
            await updateUser({
              walletBalance: user.walletBalance - wd.amount,
              bankName: wd.bankName,
              accountNumber: wd.accountNumber,
              accountName: wd.accountName,
            });
            setTransactions([
              {
                id: `tx_${Date.now()}`,
                userId: user.id,
                userName: user.name,
                type: 'withdrawal',
                amount: wd.amount,
                description: `Bank withdrawal request (Net ₦${wd.netAmount.toLocaleString()})`,
                timestamp: new Date().toISOString()
              },
              ...transactions
            ]);
            alert(`Withdrawal request submitted! Payout pending.`);
          }}
        />
      )}
    </div>
  );
}
