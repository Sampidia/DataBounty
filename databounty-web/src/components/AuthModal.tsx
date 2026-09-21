'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { DeviceSpec, DeviceType, NIGERIAN_STATES, POPULAR_OS_VERSIONS, UserRole } from '@/lib/types';
import {
  X, UserCheck, Briefcase, Lock, Mail, User, Sparkles, AlertCircle, CheckCircle2,
  Eye, EyeOff, MapPin, Smartphone, Plus, Trash2, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';

// ─── Helpers ────────────────────────────────────────────────────────────────
const DEVICE_TYPES: DeviceType[] = ['Android', 'iPhone', 'PC', 'Tablet'];

function makeDeviceId() {
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDevice(): DeviceSpec {
  return { id: makeDeviceId(), deviceType: 'Android', deviceBrand: '', osVersion: POPULAR_OS_VERSIONS.Android[0] };
}

// ─── Step Indicator ─────────────────────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < step ? 'bg-[#029FFC] w-6' : i === step ? 'bg-[#029FFC] w-8' : 'bg-slate-600 w-4'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Device Row ─────────────────────────────────────────────────────────────
function DeviceRow({
  device,
  onChange,
  onRemove,
  canRemove,
}: {
  device: DeviceSpec;
  onChange: (d: DeviceSpec) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const osList = POPULAR_OS_VERSIONS[device.deviceType];
  return (
    <div className="p-3 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-2.5">
      {/* Device Type Radio */}
      <div className="flex flex-wrap gap-2">
        {DEVICE_TYPES.map((dt) => (
          <button
            key={dt}
            type="button"
            onClick={() =>
              onChange({
                ...device,
                deviceType: dt,
                osVersion: POPULAR_OS_VERSIONS[dt][0],
              })
            }
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              device.deviceType === dt
                ? 'bg-[#025BE5] border-[#025BE5] text-white'
                : 'bg-transparent border-[#025BE5]/30 text-slate-400 hover:text-white hover:border-[#025BE5]/60'
            }`}
          >
            {dt === 'Android' ? '🤖' : dt === 'iPhone' ? '🍎' : dt === 'PC' ? '🖥' : '📱'} {dt}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Brand */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Device Brand</label>
          <input
            type="text"
            required
            value={device.deviceBrand}
            onChange={(e) => onChange({ ...device, deviceBrand: e.target.value })}
            placeholder={
              device.deviceType === 'Android' ? 'e.g. Samsung' :
              device.deviceType === 'iPhone' ? 'Apple' :
              device.deviceType === 'PC' ? 'e.g. Dell' : 'e.g. Apple'
            }
            className="w-full bg-[#020e2e] border border-[#025BE5]/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
          />
        </div>

        {/* OS Version */}
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">OS Version</label>
          <select
            value={device.osVersion}
            onChange={(e) => onChange({ ...device, osVersion: e.target.value })}
            className="w-full bg-[#020e2e] border border-[#025BE5]/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#029FFC]"
          >
            {osList.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Remove device
        </button>
      )}
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────
export function AuthModal() {
  const router = useRouter();
  const {
    isAuthModalOpen, closeAuthModal, openAuthModal, authModalRole,
    login, signup, user, updateUser, logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>(
    authModalRole === 'admin' ? 'tester' : (authModalRole || 'tester')
  );
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(0); // 0=credentials, 1=demographics, 2=devices

  // Step 0 — Credentials
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetTurnstile, setResetTurnstile] = useState(0);

  // Step 1 — Demographics
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [stateVal, setStateVal] = useState('Lagos');
  const [phone, setPhone] = useState('+234');

  // Step 2 — Devices
  const [devices, setDevices] = useState<DeviceSpec[]>([emptyDevice()]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const TOTAL_TESTER_STEPS = 3;

  // Sync activeTab if modal is opened with specific role
  React.useEffect(() => {
    if (authModalRole) {
      const safeTab = authModalRole === 'admin' ? 'tester' : authModalRole;
      setActiveTab(safeTab);
    }
  }, [authModalRole, isAuthModalOpen]);

  // Reset multi-step state when switching between sign-in / sign-up or tabs
  React.useEffect(() => {
    setStep(0);
    setErrorMsg('');
    setSuccessMsg('');
  }, [isSignUp, activeTab]);

  // Suspension notice
  React.useEffect(() => {
    if (isAuthModalOpen) return;
    const suspendedFlag = localStorage.getItem('databounty_suspended_notice');
    if (suspendedFlag === 'true') {
      localStorage.removeItem('databounty_suspended_notice');
      setIsSuspended(true);
      openAuthModal('tester');
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // ── Suspension Overlay ────────────────────────────────────────────────────
  if (isSuspended) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm bg-[#031F51] border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden text-white">
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500" />
          <button
            onClick={() => { setIsSuspended(false); logout(); closeAuthModal(); }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-8 flex flex-col items-center text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white tracking-tight">Account Notice</h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-red-500 to-rose-400 mx-auto rounded-full" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your account has been deleted or suspended. Please contact
            </p>
            <a href="mailto:support@databounty.sampidia.com" className="text-[#029FFC] font-semibold text-sm hover:underline">
              support@databounty.sampidia.com
            </a>
            <p className="text-sm text-slate-300">for assistance.</p>
            <button
              onClick={() => { setIsSuspended(false); logout(); closeAuthModal(); }}
              className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-semibold rounded-xl text-sm transition-all"
            >
              Dismiss
            </button>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500 opacity-50" />
        </div>
      </div>
    );
  }

  // ── Step validation / advance ─────────────────────────────────────────────
  const handleCredentialsNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    // Tester signup → advance to step 1
    if (isSignUp && activeTab === 'tester') {
      if (!turnstileToken) {
        setErrorMsg('Security verification required. Please complete the captcha.');
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Security verification failed. Please try again.');
          setTurnstileToken('');
          setResetTurnstile((p) => p + 1);
          return;
        }
        setStep(1);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Creator signup or sign-in (any role) → submit immediately
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        // Creator: single-step captcha check then signup
        if (!turnstileToken) {
          setErrorMsg('Security verification required. Please complete the captcha.');
          setIsSubmitting(false);
          return;
        }
        const res = await fetch('/api/auth/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Security verification failed. Please try again.');
          setTurnstileToken('');
          setResetTurnstile((p) => p + 1);
          setIsSubmitting(false);
          return;
        }
        await signup(email, password, activeTab, name);
        setSuccessMsg('Registration successful! Your account has been created. Please log in below.');
        setIsSignUp(false);
        setPassword('');
        setStep(0);
      } else {
        await login(email, password, activeTab);
        if (activeTab === 'creator') router.push('/creator');
      }
    } catch (err: any) {
      if (err.name === 'ACCOUNT_SUSPENDED' || err.message === 'ACCOUNT_SUSPENDED') {
        setIsSuspended(true);
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemographicsNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    // Validate all devices have a brand
    for (const d of devices) {
      if (!d.deviceBrand.trim()) {
        setErrorMsg('Please enter a brand for each device.');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      await signup(email, password, activeTab, name, { gender, state: stateVal, phone }, devices);
      setSuccessMsg('Registration successful! Account created. Please log in below.');
      setIsSignUp(false);
      setPassword('');
      setStep(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDevice = (index: number, updated: DeviceSpec) => {
    setDevices((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  const addDevice = () => setDevices((prev) => [...prev, emptyDevice()]);
  const removeDevice = (index: number) => setDevices((prev) => prev.filter((_, i) => i !== index));

  // ── Shared wrapper ────────────────────────────────────────────────────────
  const isTesterSignup = isSignUp && activeTab === 'tester';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl shadow-[#025BE5]/20 overflow-hidden text-white max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] sticky top-0 z-10" />

        {/* Close */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-[#025BE5]/20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Title */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#025BE5]/20 text-[#029FFC] mb-3 border border-[#0379FA]/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {isSignUp ? 'Join DataBounty' : 'Welcome Back'}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              {isTesterSignup
                ? step === 0 ? 'Step 1 of 3 — Account Credentials'
                  : step === 1 ? 'Step 2 of 3 — Demographic Profile'
                  : 'Step 3 of 3 — Device Specifications'
                : 'Select your role to access your workspace'}
            </p>
          </div>

          {/* Step dots for tester signup */}
          {isTesterSignup && <StepDots step={step} total={TOTAL_TESTER_STEPS} />}

          {/* Role Tabs — hide on steps > 0 */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#011438] rounded-xl border border-[#025BE5]/20 mb-6">
              {(['tester', 'creator'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveTab(r)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === r
                      ? 'bg-gradient-to-r from-[#025BE5] to-[#0379FA] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {r === 'tester' ? <UserCheck className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                  {r === 'tester' ? 'Tester Mode' : 'Creator Mode'}
                </button>
              ))}
            </div>
          )}

          {/* ── Logged-in role switch prompt ──────────────────────────────── */}
          {user && user.role !== activeTab && step === 0 ? (
            <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-center space-y-3 mb-4">
              <p className="text-xs text-slate-300">
                You are currently logged in as a <strong className="text-white capitalize">{user.role}</strong> ({user.email}).
                Switch to <strong className="text-[#029FFC] capitalize">{activeTab}</strong>?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await updateUser({ role: activeTab });
                    closeAuthModal();
                    if (activeTab === 'creator') router.push('/creator');
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#025BE5] to-[#029FFC] text-white font-bold rounded-lg text-xs shadow-md"
                >
                  Switch Role to {activeTab}
                </button>
                <button type="button" onClick={closeAuthModal} className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Success Alert Banner */}
              {successMsg && (
                <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-xs text-emerald-300 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ══ STEP 0 — Credentials ══════════════════════════════════ */}
              {step === 0 && (
                <form onSubmit={handleCredentialsNext} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        {activeTab === 'creator' ? 'Full Name / Company Name' : 'Full Name'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Chidi Okonkwo"
                          className="w-full pl-9 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-[#029FFC]" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isSignUp && (
                    <TurnstileWidget
                      onVerify={(t) => setTurnstileToken(t)}
                      onExpire={() => setTurnstileToken('')}
                      onError={() => setTurnstileToken('')}
                      resetSignal={resetTurnstile}
                    />
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Please wait…' : isTesterSignup ? (
                      <><span>Next</span><ChevronRight className="w-4 h-4" /></>
                    ) : isSignUp ? `Register as ${activeTab}` : `Sign In as ${activeTab}`}
                  </button>
                </form>
              )}

              {/* ══ STEP 1 — Demographics (Tester only) ══════════════════ */}
              {step === 1 && isTesterSignup && (
                <form onSubmit={handleDemographicsNext} className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Gender and State are <strong>permanent</strong> — they cannot be changed after registration to ensure demographic integrity.</span>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Male', 'Female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            gender === g
                              ? 'bg-[#025BE5] border-[#025BE5] text-white'
                              : 'bg-transparent border-[#025BE5]/30 text-slate-400 hover:text-white hover:border-[#025BE5]/60'
                          }`}
                        >
                          {g === 'Male' ? '👨 Male' : '👩 Female'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (+234)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">📞</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+2348012345678"
                        className="w-full pl-8 pr-4 py-2.5 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC] transition-all"
                      />
                    </div>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#029FFC]" /> State of Residency
                    </label>
                    <select
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#029FFC] focus:ring-1 focus:ring-[#029FFC]"
                    >
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s} State</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#025BE5] to-[#029FFC] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#025BE5]/30 transition-all"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ══ STEP 2 — Device Specs (Tester only) ══════════════════ */}
              {step === 2 && isTesterSignup && (
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#029FFC]" />
                      Add your testing devices
                    </p>
                    <button
                      type="button"
                      onClick={addDevice}
                      disabled={devices.length >= 5}
                      className="flex items-center gap-1 text-[11px] text-[#029FFC] font-semibold hover:text-white transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Device
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {devices.map((d, i) => (
                      <DeviceRow
                        key={d.id}
                        device={d}
                        onChange={(updated) => updateDevice(i, updated)}
                        onRemove={() => removeDevice(i)}
                        canRemove={devices.length > 1}
                      />
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm flex items-center justify-center gap-1 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#025BE5] to-[#029FFC] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#025BE5]/30 transition-all"
                    >
                      {isSubmitting ? 'Creating Account…' : 'Create Account 🎉'}
                    </button>
                  </div>
                </form>
              )}

              {/* Toggle sign in / sign up (step 0 only) */}
              {step === 0 && (
                <div className="mt-5 text-center text-xs text-slate-400">
                  {isSignUp ? (
                    <p>
                      Already have an account?{' '}
                      <button type="button" onClick={() => setIsSignUp(false)} className="text-[#029FFC] font-semibold hover:underline">
                        Log In
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don&apos;t have an account yet?{' '}
                      <button type="button" onClick={() => setIsSignUp(true)} className="text-[#029FFC] font-semibold hover:underline">
                        Create an account
                      </button>
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] opacity-30 sticky bottom-0" />
      </div>
    </div>
  );
}
