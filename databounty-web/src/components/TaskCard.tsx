import React from 'react';
import { BountyTask } from '@/lib/types';
import { FileSpreadsheet, Smartphone, Globe, MapPin, Users, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  task: BountyTask;
  onSelectTask: (task: BountyTask) => void;
  userState?: string;
  userGender?: string;
  userId?: string;
  hasSubmitted?: boolean;
}

export default function TaskCard({ task, onSelectTask, userState = 'Lagos', userGender = 'Female', userId, hasSubmitted = false }: TaskCardProps) {
  const [activeReservationSecs, setActiveReservationSecs] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const key = `databounty_reservation_${userId}_${task.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const rem = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
          if (rem > 0 && !hasSubmitted) {
            setActiveReservationSecs(rem);
          } else {
            localStorage.removeItem(key);
          }
        } catch (e) {}
      }
    }
  }, [userId, task.id, hasSubmitted]);

  const takenSpots = task.completedSpots + (task.pendingSpots || 0) + (task.reservedSpots || 0);
  const percentage = Math.min(100, Math.round((task.completedSpots / task.totalSpots) * 100));
  const takenPercentage = Math.min(100, Math.round((takenSpots / task.totalSpots) * 100));
  const isFull = task.completedSpots >= task.totalSpots;
  const pendingCount = task.pendingSpots || 0;
  const reservedCount = task.reservedSpots || 0;
  const isCapacityReached = takenSpots >= task.totalSpots;
  const hasActiveReservation = !hasSubmitted && activeReservationSecs !== null && activeReservationSecs > 0;

  // Eligibility check
  const isStateEligible = task.targetState === 'All' || task.targetState === userState;
  const isGenderEligible = task.targetGender === 'All' || task.targetGender === userGender;
  const isEligible = isStateEligible && isGenderEligible;

  const isDisabled = hasSubmitted || (!hasActiveReservation && (isFull || isCapacityReached || !isEligible));

  return (
    <div className={`glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden bg-[#031F51] border ${
      hasSubmitted ? 'border-emerald-500/40 bg-[#022340]' : 'border-[#025BE5]/30'
    } ${!isEligible && !hasSubmitted ? 'opacity-60' : ''}`}>
      
      {/* Category & Status Banner */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#011438] border border-[#025BE5]/30 text-slate-300">
              {task.category === 'google_form' && (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#029FFC]" />
                  <span>Google Form</span>
                </>
              )}
              {task.category === 'app_test' && (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-[#029FFC]" />
                  <span>App Testing</span>
                </>
              )}
              {task.category === 'web_bug' && (
                <>
                  <Globe className="w-3.5 h-3.5 text-[#029FFC]" />
                  <span>Web Bug Test</span>
                </>
              )}
            </div>

            {hasSubmitted && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Submitted
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Bounty Reward</span>
            <span className="text-lg font-black text-[#029FFC]">₦{task.rewardPerUser.toLocaleString()}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-[#029FFC] transition-colors">
          {task.title}
        </h3>
        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
          {task.description}
        </p>

        {/* Target Demographic Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2 py-0.5 rounded bg-[#011438] border border-[#025BE5]/30 text-[10px] text-slate-300 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#029FFC]" />
            {task.targetState === 'All' ? 'All 36 States + FCT' : task.targetState}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#011438] border border-[#025BE5]/30 text-[10px] text-slate-300 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#029FFC]" />
            {task.targetGender === 'All' ? 'All Genders' : `${task.targetGender} Only`}
          </span>
          {task.googleFormVerificationType === 'option1_webhook' && (
            <span className="px-2 py-0.5 rounded bg-[#025BE5]/20 border border-[#025BE5]/40 text-[10px] text-[#029FFC] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-[#029FFC]" />
              Auto Payout
            </span>
          )}
          {task.targetDeviceType && task.targetDeviceType !== 'All' && (
            <span className="px-2 py-0.5 rounded bg-[#011438] border border-[#025BE5]/30 text-[10px] text-slate-300 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-[#029FFC]" />
              {task.targetDeviceType}
              {task.targetOsVersion && task.targetOsVersion !== 'All' ? ` (${task.targetOsVersion})` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Spots Progress & Action Button */}
      <div className="space-y-3 pt-2 border-t border-[#025BE5]/20">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium items-center">
            <span>Spots Completed: {task.completedSpots} / {task.totalSpots}</span>
            <div className="flex items-center gap-1">
              {pendingCount > 0 && (
                <span className="text-[#029FFC] font-bold bg-[#025BE5]/20 px-1.5 py-0.5 rounded border border-[#029FFC]/30 text-[10px]">
                  {pendingCount} Pending Review
                </span>
              )}
              {reservedCount > 0 && (
                <span className="text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">
                  {reservedCount} Reserved
                </span>
              )}
              {pendingCount === 0 && reservedCount === 0 && (
                <span className="text-[#029FFC] font-bold">{percentage}%</span>
              )}
            </div>
          </div>
          {/* Progress bar: shows takenSpots (completed + pending + reserved) */}
          <div className="w-full bg-[#011438] h-2 rounded-full overflow-hidden border border-[#025BE5]/20">
            {/* Completed portion */}
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC]"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {/* Secondary bar for pending+reserved overlay */}
          {(pendingCount > 0 || reservedCount > 0) && (
            <div className="w-full bg-[#011438] h-1 rounded-full overflow-hidden border border-amber-500/20 -mt-1 opacity-60">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-500 to-amber-400"
                style={{ width: `${takenPercentage}%` }}
              />
            </div>
          )}
        </div>

        <button
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (isDisabled) return;
            onSelectTask(task);
          }}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            hasSubmitted
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 cursor-not-allowed'
              : hasActiveReservation
              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-[#029FFC] text-white shadow-lg shadow-amber-500/20 animate-pulse hover:scale-[1.01]'
              : isFull
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isCapacityReached
              ? 'bg-slate-800/80 text-amber-300 border border-amber-500/30 cursor-not-allowed'
              : !isEligible
              ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white shadow-md hover:scale-[1.01]'
          }`}
        >
          {hasSubmitted ? (
            'Already Completed ✓'
          ) : hasActiveReservation ? (
            `Resume Bounty Task ⏱ (${Math.floor((activeReservationSecs || 0) / 60)}m ${(activeReservationSecs || 0) % 60}s)`
          ) : isFull ? (
            'Bounty Completed'
          ) : isCapacityReached ? (
            'All Spots Filled (Pending Review)'
          ) : !isEligible ? (
            'Not Eligible (Location/Gender)'
          ) : (
            'View Task & Start Bounty'
          )}
        </button>
      </div>

    </div>
  );
}
