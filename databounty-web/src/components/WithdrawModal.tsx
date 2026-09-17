'use client';

import React, { useState } from 'react';
import { UserProfile, WithdrawalRequest, calculateWithdrawalFee } from '@/lib/types';
import { DEFAULT_BANK, POPULAR_NIGERIAN_BANKS, BankInfo, searchBanks } from '@/lib/banks';
import { X, Wallet, ShieldAlert, CheckCircle2, ArrowRight, Building2, Lock, Search } from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onWithdrawSubmitted: (newWithdrawal: WithdrawalRequest) => void;
}

export default function WithdrawModal({ isOpen, onClose, user, onWithdrawSubmitted }: WithdrawModalProps) {
  const [amount, setAmount] = useState<number>(2000);
  const [selectedBank, setSelectedBank] = useState<BankInfo>(DEFAULT_BANK);
  const [bankSearchQuery, setBankSearchQuery] = useState<string>('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState<boolean>(false);
  const [accountNumber, setAccountNumber] = useState<string>(user.accountNumber || '0123456789');
  const [accountName, setAccountName] = useState<string>(user.accountName || 'AMINA BELLO');
  const [isVerifyingBank, setIsVerifyingBank] = useState<boolean>(false);
  const [bankVerified, setBankVerified] = useState<boolean>(true);
  const [invalidDetailsError, setInvalidDetailsError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const withdrawalFee = calculateWithdrawalFee(amount);
  const netPayoutAmount = Math.max(0, amount - withdrawalFee);
  const filteredBanks = searchBanks(bankSearchQuery);

  const handleResolveBank = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      setInvalidDetailsError(true);
      setErrorMsg('invalid withdrawal details');
      setBankVerified(false);
      return;
    }

    setIsVerifyingBank(true);
    setInvalidDetailsError(false);
    setErrorMsg('');

    try {
      const res = await fetch('/api/bank/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBank.code,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.accountName) {
        setAccountName(data.accountName);
        setBankVerified(true);
        setInvalidDetailsError(false);
      } else {
        setBankVerified(false);
        setInvalidDetailsError(true);
        setErrorMsg('invalid withdrawal details');
      }
    } catch (err) {
      setBankVerified(false);
      setInvalidDetailsError(true);
      setErrorMsg('invalid withdrawal details');
    } finally {
      setIsVerifyingBank(false);
    }
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
    if (invalidDetailsError) {
      setErrorMsg('invalid withdrawal details');
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
      bankName: selectedBank.name,
      bankCode: selectedBank.code,
      bankTag: selectedBank.tag,
      accountNumber,
      accountName,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    onWithdrawSubmitted(newWd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#031F51] border border-[#025BE5]/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-[#025BE5]/20 flex items-center justify-between bg-[#011438]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#025BE5]/20 border border-[#025BE5]/30 flex items-center justify-center text-[#029FFC]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tester Cashout (NGN 🇳🇬)</h3>
              <p className="text-xs text-slate-400">Default Currency: Naira (NGN) • Default Bank: OPay</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#025BE5]/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Wallet Balance Header Banner */}
          <div className="p-3.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-300">Available Wallet Balance:</span>
            <span className="text-lg font-black text-[#029FFC]">₦{user.walletBalance.toLocaleString()}</span>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-200">Withdrawal Amount (₦ NGN)</label>
              <span className="text-[11px] text-amber-400 font-medium">Min Threshold: ₦100</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₦</span>
              <input
                type="number"
                min={100}
                max={user.walletBalance}
                step={50}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-[#029FFC]"
              />
            </div>
          </div>

          {/* Fee Calculation Live Preview */}
          <div className="p-3.5 bg-[#011438] border border-[#025BE5]/20 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Gross Cashout Amount:</span>
              <span className="font-semibold text-white">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300 border-b border-[#025BE5]/20 pb-2">
              <span className="flex items-center gap-1">
                Tiered Withdrawal Fee:
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-500/30">
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
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#029FFC]" />
              Bank Account & NUBAN Verification
            </h4>

            {/* Bank Searchable Dropdown & Account Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Searchable Bank Dropdown */}
              <div className="relative">
                <label className="block text-[11px] text-slate-300 mb-1">Select Bank (Searchable)</label>
                <div
                  onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                  className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white cursor-pointer flex justify-between items-center hover:border-[#029FFC]"
                >
                  <span className="font-bold text-[#029FFC]">{selectedBank.name} ({selectedBank.code})</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>

                {isBankDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#011438] border border-[#025BE5]/40 rounded-xl shadow-2xl overflow-hidden max-h-56 flex flex-col p-2">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search bank name or code..."
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        className="w-full bg-[#031F51] border border-[#025BE5]/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 space-y-1 max-h-40">
                      {filteredBanks.map((b) => (
                        <div
                          key={`${b.code}-${b.tag}`}
                          onClick={() => {
                            setSelectedBank(b);
                            setIsBankDropdownOpen(false);
                            setBankVerified(false);
                            setInvalidDetailsError(false);
                          }}
                          className={`p-2 rounded-lg text-xs cursor-pointer flex justify-between items-center ${
                            selectedBank.code === b.code
                              ? 'bg-[#025BE5] text-white font-bold'
                              : 'hover:bg-[#025BE5]/20 text-slate-200'
                          }`}
                        >
                          <span>{b.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">{b.tag} ({b.code})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Account Number & Verify Button */}
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">NUBAN Account (10 digits)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setBankVerified(false);
                      setInvalidDetailsError(false);
                    }}
                    className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC] font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleResolveBank}
                    disabled={isVerifyingBank}
                    className="bg-[#025BE5] hover:bg-[#0379FA] text-white px-3 py-2 text-xs font-bold rounded-xl transition-all border border-[#029FFC]/30 shrink-0"
                  >
                    {isVerifyingBank ? '...' : 'Verify'}
                  </button>
                </div>
              </div>
            </div>

            {/* Resolved Account Name Banner */}
            {bankVerified && !invalidDetailsError && (
              <div className="p-2.5 bg-[#011438] border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  Flutterwave Verified Name: <strong className="text-white font-bold">{accountName}</strong>
                </span>
              </div>
            )}

            {/* INVALID WITHDRAWAL DETAILS - LIGHT RED BACKGROUND */}
            {invalidDetailsError && (
              <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-300 font-bold flex items-center gap-2 shadow-sm">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>invalid withdrawal details</span>
              </div>
            )}
          </div>

          {errorMsg && !invalidDetailsError && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Secure Admin Notice */}
          <div className="p-2.5 bg-[#011438] rounded-xl text-[11px] text-slate-300 flex items-center gap-2 border border-[#025BE5]/20">
            <Lock className="w-3.5 h-3.5 text-[#029FFC] shrink-0" />
            <span>
              Default Bank: <strong>OPay</strong>. Cashout status starts as <code>PENDING</code> for Admin CSV disbursement.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm Withdrawal of ₦{netPayoutAmount.toLocaleString()}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>
      </div>
    </div>
  );
}
