'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/types';
import { X, UserCheck, Briefcase, Lock, Mail, User, Sparkles, AlertCircle } from 'lucide-react';

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, authModalRole, login, signup, user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>(authModalRole === 'admin' ? 'tester' : (authModalRole || 'tester'));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync activeTab if modal is opened with specific role
  React.useEffect(() => {
    if (authModalRole) {
      setActiveTab(authModalRole === 'admin' ? 'tester' : authModalRole);
    }
  }, [authModalRole, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signup(email, password, activeTab, name);
      } else {
        await login(email, password, activeTab);
      }
      if (activeTab === 'creator') {
        router.push('/creator');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
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
              Select your role to access your workspace
            </p>
          </div>

          {/* Role Selector Tabs (Only Tester & Creator) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#011438] rounded-xl border border-[#025BE5]/20 mb-6">
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
              Tester Mode
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
              Creator Mode
            </button>
          </div>

          {/* Prompt for already authenticated users trying to switch modes */}
          {user && user.role !== activeTab ? (
            <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-center space-y-3 mb-4">
              <p className="text-xs text-slate-300">
                You are currently logged in as a <strong className="text-white capitalize">{user.role}</strong> ({user.email}).
                Do you want to switch your account role to <strong className="text-[#029FFC] capitalize">{activeTab}</strong>?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await updateUser({ role: activeTab });
                    closeAuthModal();
                    if (activeTab === 'creator') {
                      router.push('/creator');
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#025BE5] to-[#029FFC] text-white font-bold rounded-lg text-xs shadow-md"
                >
                  Switch Role to {activeTab}
                </button>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert Message */}
              {errorMsg && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

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
                  placeholder="john@gmail.com"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : isSignUp ? `Register as ${activeTab}` : `Sign In as ${activeTab}`}</span>
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
          </>
          )}
        </div>
      </div>
    </div>
  );
}
