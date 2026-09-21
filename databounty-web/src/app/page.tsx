'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import WithdrawModal from '@/components/WithdrawModal';
import { useAuth } from '@/lib/AuthContext';
import { fetchTasksFromFirestore } from '@/lib/store';
import { UserRole, BountyTask } from '@/lib/types';
import { ArrowRight, ShieldCheck, FileSpreadsheet, Smartphone, Globe, CheckCircle2, Wallet, Users, Zap, Mail, BarChart3, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const { user: authUser, isAuthenticated, openAuthModal, updateUser } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('tester');
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  useEffect(() => {
    const tasksRef = collection(db, 'tasks');
    const unsubscribe = onSnapshot(
      tasksRef,
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BountyTask));
          loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTasks(loaded);
        } else {
          setTasks([]);
        }
      },
      (err) => {
        console.warn('[HomePage] Real-time tasks snapshot error:', err);
        fetchTasksFromFirestore().then((loaded) => {
          if (loaded) setTasks(loaded);
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const activeUser = authUser || {
    id: 'usr_guest',
    name: 'Guest User',
    email: '',
    phone: '',
    gender: 'Female' as const,
    country: 'Nigeria',
    state: 'Lagos',
    deviceBrand: 'Mobile',
    deviceModel: 'Device',
    osVersion: 'Android 14',
    bankName: '',
    accountNumber: '',
    accountName: 'GUEST',
    walletBalance: 0,
    escrowBalance: 0,
    role: 'tester' as const,
  };

  const handleTaskCreated = (newTask: BountyTask) => {
    setTasks([newTask, ...tasks]);
  };

  // Filter uncompleted active tasks with open spots, sorted by MOST available spots first
  const featuredBounties = React.useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status === 'suspended' || t.status === 'completed') return false;
        const takenSpots = t.completedSpots + (t.pendingSpots || 0) + (t.reservedSpots || 0);
        const availableSpots = t.totalSpots - takenSpots;
        return availableSpots > 0 && t.completedSpots < t.totalSpots;
      })
      .sort((a, b) => {
        const takenA = a.completedSpots + (a.pendingSpots || 0) + (a.reservedSpots || 0);
        const availA = a.totalSpots - takenA;

        const takenB = b.completedSpots + (b.pendingSpots || 0) + (b.reservedSpots || 0);
        const availB = b.totalSpots - takenB;

        if (availB !== availA) {
          return availB - availA; // Most available spots first
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Navbar
        currentRole={userRole}
        setRole={setUserRole}
        walletBalance={activeUser.walletBalance}
        openCreateTaskModal={() => setIsCreateModalOpen(true)}
        openWithdrawModal={() => setIsWithdrawModalOpen(true)}
      />

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nigeria’s Premier Tasking & QA Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              Turn Simple Feedback into <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Naira Earnings</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
              Publish Google Forms, Mobile Apps, & Web Bug bounties. Creators reach targeted demographics across 36 Nigerian States while testers earn rewards starting at <strong className="text-emerald-400">₦100 minimum payout</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/tasks"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-gray-950 font-black rounded-xl text-sm shadow-xl glow-emerald flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>Browse Available Bounties</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/creator"
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm border border-gray-800 flex items-center justify-center gap-2 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Creator Analytics Dashboard</span>
              </Link>
            </div>


          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 bg-gray-950/60 border-y border-gray-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">How DataBounty Works</h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Seamless workflow for both campaign creators and targeted Nigerian testers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-6 rounded-2xl relative space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-white">Publish Bounty Campaign</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Creators upload Google Forms, Android APKs, or Web test links. Set demographic criteria: Country (Nigeria), 36 States + FCT, and Gender filters.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl relative space-y-3">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-white">Testers Match & Complete</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Testers browse bounties matched to their state & device. Complete forms or upload screenshots before the reservation timer expires.
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl relative space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                  3
                </div>
                <h3 className="text-lg font-bold text-white">Instant Verification & Cashout</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Option 1 Google Forms pay out automatically via Google Sheet Webhooks. Cash out rewards to any Nigerian bank once balance hits ₦100.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RECENT BOUNTIES PREVIEW */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Live Bounties</h2>
              <p className="text-xs text-gray-400">Demographic matched tasks open for completion</p>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All Bounties</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredBounties.length === 0 ? (
            <div className="p-8 text-center glass-panel rounded-2xl border border-gray-800 space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Live Bounties Right Now</h3>
              <p className="text-xs text-gray-400">Be the first campaign creator to publish a task!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBounties.slice(0, 3).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelectTask={() => {
                    if (!isAuthenticated) {
                      alert('Authentication required: Please sign in or register to claim bounties.');
                      openAuthModal('tester');
                      return;
                    }
                    window.location.href = '/tasks';
                  }}
                  userState={activeUser.state}
                  userGender={activeUser.gender}
                />
              ))}
            </div>
          )}
        </section>

        {/* TRANSPARENT FEE STRUCTURE BANNER */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 rounded-3xl border border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  100% Transparent Fee Structure
                </div>
                <h3 className="text-2xl font-bold text-white">Low Creator Fees & Fair Tester Withdrawals</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  We maintain total transparency. Creators pay small fixed service fees per campaign tier while testers enjoy low cashout fees.
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 pt-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>Support: <strong className="text-white">support@databounty.sampidia.com</strong></span>
                </div>
              </div>

              {/* Fee Table Preview Card */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3 text-xs">
                <h4 className="font-bold text-white border-b border-gray-800 pb-2">Platform Fee Schedule</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-300">Creator Task Budget (₦100 – ₦9,999)</span>
                    <strong className="text-emerald-400">₦50 Fee</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-300">Creator Task Budget (₦10,000 – ₦49,999)</span>
                    <strong className="text-emerald-400">₦100 Fee</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-300">Creator Task Budget (₦50,000+)</span>
                    <strong className="text-emerald-400">₦500 Fee</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-800/60">
                    <span className="text-gray-300">Tester Cashout (₦100 – ₦9,999)</span>
                    <strong className="text-amber-400">₦50 Fee</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-300">Tester Cashout (₦10,000+)</span>
                    <strong className="text-amber-400">₦100 Fee</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        user={activeUser}
        onWithdrawSubmitted={async (wd) => {
          if (authUser) {
            await updateUser({
              walletBalance: activeUser.walletBalance - wd.amount,
              bankName: wd.bankName,
              accountNumber: wd.accountNumber,
              accountName: wd.accountName,
            });
          }
          alert(`Withdrawal request for ₦${wd.netAmount.toLocaleString()} submitted! Admin notified.`);
        }}
      />
    </div>
  );
}
