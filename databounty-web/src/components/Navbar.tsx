'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/types';
import { Shield, Wallet, PlusCircle, User, BarChart3, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  currentRole?: UserRole;
  setRole?: (role: UserRole) => void;
  walletBalance?: number;
  openCreateTaskModal?: () => void;
  openWithdrawModal?: () => void;
}

export default function Navbar({
  currentRole: propRole,
  setRole: propSetRole,
  walletBalance: propWalletBalance,
  openCreateTaskModal,
  openWithdrawModal,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, role, isAuthenticated, openAuthModal, logout, login } = useAuth();

  const activeRole = propRole || role;
  const balance = propWalletBalance !== undefined ? propWalletBalance : (user?.walletBalance || 0);

  const handleRoleChange = (newRole: UserRole) => {
    if (propSetRole) {
      propSetRole(newRole);
    }
    if (isAuthenticated) {
      login(newRole, user?.email, user?.name);
    } else {
      openAuthModal(newRole);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#025BE5]/25 bg-[#031F51]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-10 w-36 sm:w-44 flex items-center">
            <Image 
              src="/Databounty_logo.webp" 
              alt="DataBounty Logo" 
              width={180} 
              height={50} 
              priority
              className="object-contain h-9 w-auto filter drop-shadow-[0_2px_8px_rgba(2,159,252,0.3)] transition-transform group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Dynamic Navigation Links Based on User Role */}
        <nav className="hidden md:flex items-center gap-1.5">
          {/* Tester or Guest Link */}
          {(activeRole === 'tester' || activeRole === 'guest') && (
            <Link
              href="/tasks"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/tasks'
                  ? 'bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Explore Bounties
            </Link>
          )}

          {/* Creator Link */}
          {activeRole === 'creator' && (
            <Link
              href="/creator"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === '/creator'
                  ? 'bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#029FFC]" />
              Creator Dashboard
            </Link>
          )}

          {/* Profile & Wallet Link (Tester or Creator) */}
          {(activeRole === 'tester' || activeRole === 'creator') && (
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname === '/profile'
                  ? 'bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              My Profile & Wallet
            </Link>
          )}

          {/* Admin Suite Link */}
          {activeRole === 'admin' && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                pathname === '/admin'
                  ? 'bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30'
                  : 'text-slate-300 hover:text-[#029FFC] hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4 text-[#029FFC]" />
              Admin Suite
            </Link>
          )}
        </nav>

        {/* Right Section: Role Mode & Wallet & Auth */}
        <div className="flex items-center gap-3">
          
          {/* Role Mode Selector Dropdown / Pill */}
          <div className="flex items-center bg-[#011438] border border-[#025BE5]/30 rounded-xl p-1 text-xs">
            <button
              onClick={() => handleRoleChange('tester')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeRole === 'tester'
                  ? 'bg-[#025BE5] text-white shadow-md shadow-[#025BE5]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tester
            </button>
            <button
              onClick={() => handleRoleChange('creator')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeRole === 'creator'
                  ? 'bg-[#025BE5] text-white shadow-md shadow-[#025BE5]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Creator
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                activeRole === 'admin'
                  ? 'bg-[#0136BD] text-white shadow-md shadow-[#0136BD]/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Wallet Balance Pill */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2 bg-[#011438] border border-[#025BE5]/40 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
              <Wallet className="w-4 h-4 text-[#029FFC]" />
              <span>
                Balance: <strong className="text-white text-sm font-bold">₦{balance.toLocaleString()}</strong>
              </span>
            </div>
          )}

          {/* Quick Action Button depending on Role */}
          {activeRole === 'creator' && openCreateTaskModal && (
            <button
              onClick={openCreateTaskModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#025BE5] via-[#0379FA] to-[#029FFC] hover:opacity-95 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-[#025BE5]/30 transition-transform hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              New Bounty
            </button>
          )}

          {activeRole === 'tester' && openWithdrawModal && (
            <button
              onClick={openWithdrawModal}
              className="flex items-center gap-1.5 bg-[#025BE5]/20 hover:bg-[#025BE5]/30 text-[#029FFC] border border-[#025BE5]/40 font-bold px-3 py-1.5 rounded-xl text-xs transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-[#029FFC]" />
              Cash Out
            </button>
          )}

          {/* Login / Logout Button */}
          {isAuthenticated ? (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('tester')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#025BE5] to-[#0379FA] hover:opacity-95 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-[#025BE5]/30 transition-transform hover:scale-[1.02]"
            >
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
