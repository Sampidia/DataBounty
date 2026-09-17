import React from 'react';
import Link from 'next/link';
import { Mail, ShieldCheck, HeartHandshake, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/80 mt-20 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Platform Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm">
                DB
              </div>
              <span className="text-lg font-bold text-white">DataBounty</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Nigeria’s premier micro-tasking & QA testing platform. Creators publish bounties for Google Forms, Mobile Apps, and Web testing. Testers earn Naira with instant verification.
            </p>
            <div className="pt-1 flex items-center gap-2 text-emerald-400 font-medium">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@databounty.sampidia.com" className="hover:underline">
                support@databounty.sampidia.com
              </a>
            </div>
          </div>

          {/* Col 2: Fee Structure */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Transparent Fee Tiers
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex justify-between border-b border-gray-800/60 pb-1">
                <span>Creator Task (₦100–₦9.9k):</span>
                <strong className="text-emerald-300">₦50 Fee</strong>
              </li>
              <li className="flex justify-between border-b border-gray-800/60 pb-1">
                <span>Creator Task (₦10k–₦49.9k):</span>
                <strong className="text-emerald-300">₦100 Fee</strong>
              </li>
              <li className="flex justify-between border-b border-gray-800/60 pb-1">
                <span>Creator Task (₦50k+):</span>
                <strong className="text-emerald-300">₦500 Fee</strong>
              </li>
              <li className="flex justify-between border-b border-gray-800/60 pb-1">
                <span>Tester Cashout (₦100–₦9.9k):</span>
                <strong className="text-amber-300">₦50 Fee</strong>
              </li>
              <li className="flex justify-between border-b border-gray-800/60 pb-1">
                <span>Tester Cashout (₦10k+):</span>
                <strong className="text-amber-300">₦100 Fee</strong>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tasks" className="hover:text-emerald-400 transition-colors">
                  Browse Available Bounties
                </Link>
              </li>
              <li>
                <Link href="/creator" className="hover:text-emerald-400 transition-colors">
                  Creator Campaign Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-emerald-400 transition-colors">
                  Profile & Bank Account Setup
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors text-purple-400">
                  Admin Platform Revenue Suite
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Verification Guarantee */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              Automated Payout Engine
            </h4>
            <p className="text-gray-400 leading-relaxed">
              Google Forms with Option 1 Google Sheet Webhook trigger instant automated wallet payouts as soon as form responses are recorded.
            </p>
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 flex items-center justify-between">
              <span>Minimum Payout Threshold:</span>
              <span className="font-bold text-emerald-400 text-sm">₦100 Naira</span>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-gray-500 text-[11px]">
          <p>© {new Date().getFullYear()} DataBounty Nigeria. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>Built for Nigerian Creators & Testers</span>
            <span>•</span>
            <a href="mailto:support@databounty.sampidia.com" className="hover:text-emerald-400">
              Need Help? Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
