'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { Shield, Wallet, PlusCircle, CheckCircle2, User, HelpCircle, BarChart3 } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  walletBalance: number;
  openCreateTaskModal?: () => void;
  openWithdrawModal?: () => void;
}

export default function Navbar({
  currentRole,
  setRole,
  walletBalance,
  openCreateTaskModal,
  openWithdrawModal,
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center glow-emerald shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
              <span className="text-emerald-400 font-extrabold text-xl tracking-tighter">DB</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              Data<span className="text-emerald-400">Bounty</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">NG</span>
            </span>
            <span className="text-[10px] text-gray-400 -mt-1 font-medium">Micro-Tasks & QA Testing</span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/tasks"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/tasks'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            Explore Bounties
          </Link>
          <Link
            href="/creator"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === '/creator'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Creator Dashboard
          </Link>
          <Link
            href="/profile"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/profile'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            My Profile & Wallet
          </Link>
          <Link
            href="/admin"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === '/admin'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'text-gray-400 hover:text-purple-300 hover:bg-gray-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400" />
            Admin Suite
          </Link>
        </nav>

        {/* Right Section: Role Switcher & Wallet */}
        <div className="flex items-center gap-3">
          
          {/* Role Mode Selector Dropdown */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setRole('tester')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                currentRole === 'tester'
                  ? 'bg-emerald-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tester Mode
            </button>
            <button
              onClick={() => setRole('creator')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                currentRole === 'creator'
                  ? 'bg-teal-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Creator Mode
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Wallet Balance Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>
              Balance: <strong className="text-white text-sm font-bold">₦{walletBalance.toLocaleString()}</strong>
            </span>
          </div>

          {/* Quick Action Button depending on Role */}
          {currentRole === 'creator' && openCreateTaskModal && (
            <button
              onClick={openCreateTaskModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-transform hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              New Bounty
            </button>
          )}

          {currentRole === 'tester' && openWithdrawModal && (
            <button
              onClick={openWithdrawModal}
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              Cash Out (Min ₦100)
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
