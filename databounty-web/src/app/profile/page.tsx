'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WithdrawModal from '@/components/WithdrawModal';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_TRANSACTIONS } from '@/lib/store';
import { NIGERIAN_STATES, Transaction } from '@/lib/types';
import { User, Wallet, ShieldCheck, CheckCircle2, Save, ArrowDownRight, ArrowUpRight, Smartphone, LogIn, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, openAuthModal, updateUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(user?.gender || 'Male');
  const [state, setState] = useState(user?.state || 'Lagos');
  const [deviceBrand, setDeviceBrand] = useState(user?.deviceBrand || 'Tecno');
  const [deviceModel, setDeviceModel] = useState(user?.deviceModel || 'Camon 20');
  const [osVersion, setOsVersion] = useState(user?.osVersion || 'Android 13');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setGender(user.gender);
      setState(user.state);
      setDeviceBrand(user.deviceBrand);
      setDeviceModel(user.deviceModel);
      setOsVersion(user.osVersion);
    }
  }, [user]);

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
                Profile Settings & Wallet Overview
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
              <h3 className="text-base font-bold text-white">Recent Wallet Activity & Payout History</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#011438] text-slate-300 uppercase tracking-wider border-b border-[#025BE5]/30">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#025BE5]/20 text-slate-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#025BE5]/10">
                        <td className="p-3">
                          {tx.type === 'task_reward' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                              <ArrowDownRight className="w-3 h-3 text-emerald-400" /> Reward
                            </span>
                          )}
                          {tx.type === 'withdrawal' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                              <ArrowUpRight className="w-3 h-3 text-amber-400" /> Cashout
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
                        <td className="p-3">{tx.description}</td>
                        <td className="p-3 font-bold text-white">
                          ₦{tx.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          onWithdrawSubmitted={(wd) => {
            updateUser({ walletBalance: user.walletBalance - wd.amount });
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
