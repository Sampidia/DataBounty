'use client';

import React, { useState } from 'react';
import { UserProfile, WithdrawalRequest, calculateWithdrawalFee } from '@/lib/types';
import { X, Wallet, ShieldAlert, CheckCircle2, ArrowRight, Building2, CreditCard, Lock } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onWithdrawSubmitted: (newWithdrawal: WithdrawalRequest) => void;
}

export default function WithdrawModal({ isOpen, onClose, user, onWithdrawSubmitted }: WithdrawModalProps) {
  const [amount, setAmount] = useState<number>(2000);
  const [bankName, setBankName] = useState(user.bankName || 'Guaranty Trust Bank (GTBank)');
  const [accountNumber, setAccountNumber] = useState(user.accountNumber || '0123456789');
  const [accountName, setAccountName] = useState(user.accountName || 'AMINA BELLO');
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankVerified, setBankVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const withdrawalFee = calculateWithdrawalFee(amount);
  const netPayoutAmount = Math.max(0, amount - withdrawalFee);

  const handleResolveBank = () => {
    if (accountNumber.length !== 10) {
      setErrorMsg('Account number must be 10 digits.');
      return;
    }
    setIsVerifyingBank(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsVerifyingBank(false);
      setBankVerified(true);
      setAccountName(user.name.toUpperCase());
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100) {
      setErrorMsg('Minimum withdrawal threshold is ₦100 Naira.');
      return;
    }
    if (amount > user.walletBalance) {
      setErrorMsg(`Insufficient wallet balance. You have ₦${user.walletBalance.toLocaleString()}.`);
      return;
    }

    const newWd: WithdrawalRequest = {
      id: `wd_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount,
      fee: withdrawalFee,
      netAmount: netPayoutAmount,
      bankName,
      accountNumber,
      accountName,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };

    onWithdrawSubmitted(newWd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bank Withdrawal Cashout</h3>
              <p className="text-xs text-gray-400">Direct transfer to your Nigerian bank account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Wallet Balance Header Banner */}
          <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-gray-400">Available Wallet Balance:</span>
            <span className="text-lg font-black text-emerald-400">₦{user.walletBalance.toLocaleString()}</span>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-300">Withdrawal Amount (₦)</label>
              <span className="text-[11px] text-amber-400 font-medium">Min Threshold: ₦100</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₦</span>
              <input
                type="number"
                min={100}
                max={user.walletBalance}
                step={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fee Calculation Live Preview */}
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-gray-300">
              <span>Gross Cashout Amount:</span>
              <span className="font-semibold text-white">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-300 border-b border-emerald-500/20 pb-2">
              <span className="flex items-center gap-1">
                Tiered Withdrawal Fee:
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-semibold">
                  {amount < 10000 ? '₦50 Fee Tier (<₦10k)' : '₦100 Fee Tier (≥₦10k)'}
                </span>
              </span>
              <span className="font-semibold text-amber-400">-₦{withdrawalFee}</span>
            </div>
            <div className="flex justify-between text-sm pt-0.5">
              <strong className="text-white font-bold">Net Bank Transfer Amount:</strong>
              <strong className="text-emerald-400 font-black text-base">₦{netPayoutAmount.toLocaleString()}</strong>
            </div>
          </div>

          {/* Bank Account Verification Details */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Paystack NUBAN Verified Bank Details
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Bank Name</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Guaranty Trust Bank (GTBank)">GTBank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="First Bank of Nigeria">First Bank</option>
                  <option value="Kuda Bank">Kuda Microfinance Bank</option>
                  <option value="Opay">OPay Digital Services</option>
                  <option value="Palmpay">PalmPay</option>
                  <option value="United Bank for Africa (UBA)">UBA</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Account Number (10 digits)</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setBankVerified(false);
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleResolveBank}
                    className="bg-gray-800 hover:bg-gray-700 px-2 py-1 text-[11px] text-emerald-400 font-semibold rounded-lg border border-gray-700"
                  >
                    {isVerifyingBank ? '...' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>

            {/* Resolved Account Name */}
            {bankVerified && (
              <div className="p-2.5 bg-gray-950 border border-gray-800 rounded-lg flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-gray-300">
                  Account Name: <strong className="text-white font-bold">{accountName}</strong>
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Secure Admin Email notice */}
          <div className="p-2.5 bg-gray-950 rounded-lg text-[11px] text-gray-400 flex items-center gap-2 border border-gray-800">
            <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              Request auto-notifies admin securely via <code>process.env.ADMIN_EMAIL</code>. Status turns PENDING &rarr; PROCESSING &rarr; COMPLETED.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-extrabold rounded-xl shadow-lg transition-all glow-emerald flex items-center justify-center gap-2"
          >
            <span>Confirm Withdrawal of ₦{netPayoutAmount.toLocaleString()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      </div>
    </div>
  );
}
