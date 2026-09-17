'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WithdrawModal from '@/components/WithdrawModal';
import { INITIAL_USER, INITIAL_TRANSACTIONS } from '@/lib/store';
import { NIGERIAN_STATES, UserRole, UserProfile, Transaction } from '@/lib/types';
import { User, Wallet, Building2, Smartphone, ShieldCheck, CheckCircle2, Save, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function ProfilePage() {
  const [userRole, setUserRole] = useState<UserRole>('tester');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [gender, setGender] = useState<'Male' | 'Female'>(user.gender);
  const [state, setState] = useState(user.state);
  const [deviceBrand, setDeviceBrand] = useState(user.deviceBrand);
  const [deviceModel, setDeviceModel] = useState(user.deviceModel);
  const [osVersion, setOsVersion] = useState(user.osVersion);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user,
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
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Navbar
        currentRole={userRole}
        setRole={setUserRole}
        walletBalance={user.walletBalance}
        openWithdrawModal={() => setIsWithdrawModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        
        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-emerald-400" />
            Profile Settings & Wallet Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage your personal demographic details, bank account, and withdrawal funds.
          </p>
        </div>

        {/* Top Row: Wallet Card & Quick Cashout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Wallet Balance Card */}
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-gray-800 space-y-5 bg-gradient-to-tr from-gray-900 via-gray-900 to-emerald-950/40">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Tester Wallet Balance
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold">
                NGN 🇳🇬
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-white">₦{user.walletBalance.toLocaleString()}</div>
              <p className="text-xs text-gray-400">Available for instant bank payout</p>
            </div>

            <div className="pt-2 border-t border-gray-800 space-y-2 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Minimum Cashout Threshold:</span>
                <strong className="text-emerald-400">₦100</strong>
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
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-black rounded-xl text-xs shadow-lg glow-emerald transition-all"
            >
              Request Bank Withdrawal
            </button>
          </div>

          {/* User Profile Form */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-800 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
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
                  <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Phone Number (+234)</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    State of Residency Target (36 States + FCT)
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
              <div className="pt-3 border-t border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-teal-400" />
                  Captured Testing Device Specifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Device Brand</label>
                    <input
                      type="text"
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Device Model</label>
                    <input
                      type="text"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Android OS Version</label>
                    <input
                      type="text"
                      value={osVersion}
                      onChange={(e) => setOsVersion(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Save Profile Changes
                </button>
              </div>

            </form>
          </div>

        </div>

        {/* Transaction History Table */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white">Recent Wallet Activity & Payout History</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-900/50">
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
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold w-max block">
                          Creator Fee
                        </span>
                      )}
                      {tx.type === 'escrow_deposit' && (
                        <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold w-max block">
                          Escrow Deposit
                        </span>
                      )}
                    </td>
                    <td className="p-3">{tx.description}</td>
                    <td className="p-3 font-bold text-white">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-gray-400 text-[11px]">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <Footer />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        user={user}
        onWithdrawSubmitted={(wd) => {
          setUser({ ...user, walletBalance: user.walletBalance - wd.amount });
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
    </div>
  );
}
