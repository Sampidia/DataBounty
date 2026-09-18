'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/types';
import { Shield, Wallet, PlusCircle, User, BarChart3, LogIn, LogOut, Menu, X as CloseIcon } from 'lucide-react';

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
  const { user, role, isAuthenticated, openAuthModal, logout, login, updateUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRole = propRole || role;
  const balance = propWalletBalance !== undefined ? propWalletBalance : (user?.walletBalance || 0);

  const handleRoleChange = (newRole: UserRole) => {
    if (propSetRole) {
      propSetRole(newRole);
    }
    if (isAuthenticated) {
      updateUser({ role: newRole });
    } else {
      openAuthModal(newRole);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#025BE5]/25 bg-[#031F51]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-14 px-[7px] py-[1px] bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-[#025BE5]/20 flex items-center justify-center transition-all group-hover:scale-105">
            <Image
              src="/Databounty_logo.webp"
              alt="DataBounty Logo"
              width={1774}
              height={887}
              priority
              className="object-contain h-13 sm:h-14 w-auto"
            />
          </div>
        </Link>

        {/* Mobile Quick Action & Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#029FFC] bg-[#011438] px-2.5 py-1 rounded-lg border border-[#025BE5]/30">
                ₦{balance.toLocaleString()}
              </span>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-300 hover:text-red-400 bg-white/5 hover:bg-red-500/20 rounded-lg border border-white/10"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('tester')}
              className="flex items-center gap-1 bg-gradient-to-r from-[#025BE5] to-[#0379FA] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-[#025BE5]/30"
            >
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white bg-white/5 rounded-lg border border-white/10"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {/* Tester or Guest Link */}
          {(activeRole === 'tester' || activeRole === 'guest') && (
            <Link
              href="/tasks"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === '/tasks'
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
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${pathname === '/creator'
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
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === '/profile'
                ? 'bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
            >
              My Profile & Wallet
            </Link>
          )}

          {/* Role Mode Selector Pill */}
          {!isAuthenticated ? (
            <div className="flex items-center bg-[#011438] border border-[#025BE5]/30 rounded-xl p-1 text-xs">
              <button
                onClick={() => handleRoleChange('tester')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${activeRole === 'tester'
                  ? 'bg-[#025BE5] text-white shadow-md shadow-[#025BE5]/20'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Tester
              </button>
              <button
                onClick={() => handleRoleChange('creator')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${activeRole === 'creator'
                  ? 'bg-[#025BE5] text-white shadow-md shadow-[#025BE5]/20'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Creator
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-[#011438] border border-[#025BE5]/30 rounded-xl px-3 py-1.5 text-xs font-bold text-[#029FFC] capitalize">
              {role === 'creator' ? '⚡ Creator' : '🎯 Tester'}
            </div>
          )}

          {/* Wallet Balance Pill */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2 bg-[#011438] border border-[#025BE5]/40 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
              <Wallet className="w-4 h-4 text-[#029FFC]" />
              <span>
                Balance: <strong className="text-white text-sm font-bold">₦{balance.toLocaleString()}</strong>
              </span>
            </div>
          )}

          {/* Quick Action Button depending on Role - Requires Authentication */}
          {isAuthenticated && activeRole === 'creator' && openCreateTaskModal && (
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
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
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
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#025BE5]/30 bg-[#011438]/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Role</span>
            {!isAuthenticated ? (
              <div className="flex items-center bg-[#031F51] border border-[#025BE5]/30 rounded-lg p-1 text-xs">
                <button
                  onClick={() => handleRoleChange('tester')}
                  className={`px-3 py-1 rounded font-bold transition-all ${activeRole === 'tester' ? 'bg-[#025BE5] text-white' : 'text-slate-400'
                    }`}
                >
                  Tester
                </button>
                <button
                  onClick={() => handleRoleChange('creator')}
                  className={`px-3 py-1 rounded font-bold transition-all ${activeRole === 'creator' ? 'bg-[#025BE5] text-white' : 'text-slate-400'
                    }`}
                >
                  Creator
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-[#029FFC] bg-[#025BE5]/20 px-2.5 py-1 rounded-md border border-[#025BE5]/40 capitalize">
                {role === 'creator' ? '⚡ Creator' : '🎯 Tester'}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center justify-between"
            >
              <span>Explore Bounties</span>
            </Link>

            {activeRole === 'creator' && (
              <Link
                href="/creator"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#029FFC]" />
                  Creator Dashboard
                </span>
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center justify-between"
            >
              <span>My Profile & Wallet</span>
            </Link>

            {isAuthenticated && activeRole === 'creator' && openCreateTaskModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openCreateTaskModal();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#025BE5] to-[#029FFC] text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Bounty
              </button>
            )}

            {activeRole === 'tester' && openWithdrawModal && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openWithdrawModal();
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#025BE5]/20 text-[#029FFC] border border-[#025BE5]/40 font-bold py-2.5 rounded-xl text-xs"
              >
                <Wallet className="w-4 h-4" />
                Cash Out
              </button>
            )}

            <div className="pt-2 border-t border-white/10">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('tester');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#025BE5] to-[#0379FA] text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  Log In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
