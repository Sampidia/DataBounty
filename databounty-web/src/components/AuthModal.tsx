'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/types';
import { X, Shield, UserCheck, Briefcase, Lock, Mail, User, Sparkles } from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalRole, login } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>(authModalRole || 'tester');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Sync activeTab if modal is opened with specific role
  React.useEffect(() => {
    if (authModalRole) {
      setActiveTab(authModalRole);
    }
  }, [authModalRole, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(activeTab, email || undefined, name || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl shadow-[#025BE5]/20 overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC]" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-[#025BE5]/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Title & Description */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#025BE5]/20 text-[#029FFC] mb-3 border border-[#0379FA]/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {isSignUp ? 'Join DataBounty' : 'Welcome Back'}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Select your role to access your personalized workspace
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#011438] rounded-xl border border-[#025BE5]/20 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('tester')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tester'
                  ? 'bg-gradient-to-r from-[#025BE5] to-[#0379FA] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Tester
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('creator')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'creator'
                  ? 'bg-gradient-to-r from-[#025BE5] to-[#0379FA] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Creator
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-[#0136BD] to-[#025BE5] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name / Company Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chidi Okonkwo"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC] transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeTab === 'admin' 
                      ? 'admin@databounty.sampidia.com' 
                      : activeTab === 'creator' 
                        ? 'creator@databounty.sampidia.com' 
                        : 'tester@databounty.sampidia.com'
                  }
                  className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC] transition-all"
                />
              </div>
            </div>

            {/* Quick Demo Credentials Info */}
            <div className="p-3 bg-[#025BE5]/10 rounded-xl border border-[#025BE5]/20 text-xs text-slate-300">
              <span className="font-semibold text-[#029FFC]">Demo Access:</span> Any email/password will log you into the demo account as <span className="capitalize font-bold text-white">{activeTab}</span>.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>{isSignUp ? `Register as ${activeTab}` : `Sign In as ${activeTab}`}</span>
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="mt-5 text-center text-xs text-slate-400">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-[#029FFC] font-semibold hover:underline"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-[#029FFC] font-semibold hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
