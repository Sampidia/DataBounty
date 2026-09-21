'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DeviceSpec, DeviceType, NIGERIAN_STATES, POPULAR_OS_VERSIONS } from '@/lib/types';
import { X, Sparkles, AlertCircle, MapPin, Smartphone, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';

const DEVICE_TYPES: DeviceType[] = ['Android', 'iPhone', 'PC', 'Tablet'];

function makeDeviceId() {
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDevice(): DeviceSpec {
  return { id: makeDeviceId(), deviceType: 'Android', deviceBrand: '', osVersion: POPULAR_OS_VERSIONS.Android[0] };
}

export function TesterOnboardingModal() {
  const { user, needsTesterOnboarding, setNeedsTesterOnboarding, updateUser } = useAuth();

  const [gender, setGender] = useState<'Male' | 'Female'>(user?.gender || 'Male');
  const [stateVal, setStateVal] = useState<string>(user?.state || 'Lagos');
  const [phone, setPhone] = useState<string>(user?.phone || '+234');
  const [devices, setDevices] = useState<DeviceSpec[]>([emptyDevice()]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!needsTesterOnboarding || !user) return null;

  const updateDevice = (index: number, updated: DeviceSpec) => {
    setDevices((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  const addDevice = () => setDevices((prev) => [...prev, emptyDevice()]);
  const removeDevice = (index: number) => setDevices((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    for (const d of devices) {
      if (!d.deviceBrand.trim()) {
        setErrorMsg('Please enter a brand for each device.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await updateUser({
        gender,
        state: stateVal,
        phone,
        devices,
      });
      setNeedsTesterOnboarding(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#031F51] border border-[#025BE5]/30 rounded-2xl shadow-2xl shadow-[#025BE5]/20 overflow-hidden text-white max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] sticky top-0 z-10" />

        <button
          onClick={() => setNeedsTesterOnboarding(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-[#025BE5]/20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#025BE5]/20 text-[#029FFC] mb-3 border border-[#0379FA]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Tester Onboarding Required
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Please complete your demographic &amp; testing device profile to start completing bounties.
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Gender and State of Residency will be <strong>locked</strong> once set to prevent demographic gaming.</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
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
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2348012345678"
                className="w-full px-3 py-2 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#029FFC]"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#029FFC]" /> State of Residency
              </label>
              <select
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="w-full bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#029FFC]"
              >
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s} State</option>
                ))}
              </select>
            </div>

            {/* Device Specs */}
            <div className="pt-2 border-t border-[#025BE5]/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#029FFC]" />
                  Testing Device Specs
                </label>
                <button
                  type="button"
                  onClick={addDevice}
                  disabled={devices.length >= 5}
                  className="flex items-center gap-1 text-[11px] text-[#029FFC] font-semibold hover:text-white transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Device
                </button>
              </div>

              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {devices.map((d, i) => (
                  <div key={d.id} className="p-3 bg-[#011438] border border-[#025BE5]/30 rounded-xl space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {DEVICE_TYPES.map((dt) => (
                        <button
                          key={dt}
                          type="button"
                          onClick={() =>
                            updateDevice(i, {
                              ...d,
                              deviceType: dt,
                              osVersion: POPULAR_OS_VERSIONS[dt][0],
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            d.deviceType === dt
                              ? 'bg-[#025BE5] border-[#025BE5] text-white'
                              : 'bg-transparent border-[#025BE5]/30 text-slate-400 hover:text-white'
                          }`}
                        >
                          {dt}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Device Brand</label>
                        <input
                          type="text"
                          required
                          value={d.deviceBrand}
                          onChange={(e) => updateDevice(i, { ...d, deviceBrand: e.target.value })}
                          placeholder="e.g. Samsung, Apple"
                          className="w-full bg-[#020e2e] border border-[#025BE5]/30 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">OS Version</label>
                        <select
                          value={d.osVersion}
                          onChange={(e) => updateDevice(i, { ...d, osVersion: e.target.value })}
                          className="w-full bg-[#020e2e] border border-[#025BE5]/30 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {POPULAR_OS_VERSIONS[d.deviceType].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {devices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDevice(i)}
                        className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" /> Remove device
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-[#025BE5]/30 transition-all text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Saving Profile…' : 'Complete Onboarding &amp; Start Testing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
