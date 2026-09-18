import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[#025BE5]/25 bg-[#031F51]/90 mt-20 text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1: Platform Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative px-[7px] py-[1px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-md inline-flex items-center h-14">
                <Image 
                  src="/Databounty_logo.webp" 
                  alt="DataBounty Logo" 
                  width={400} 
                  height={200} 
                  className="object-contain h-13 sm:h-14 w-auto"
                />
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Nigeria’s premier micro-tasking & QA testing platform. Creators publish bounties for Google Forms, Mobile Apps, and Web testing. Testers earn Naira with instant verification.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[#029FFC] font-medium">
              <Mail className="w-4 h-4 text-[#029FFC]" />
              <a href="mailto:support@databounty.sampidia.com" className="hover:underline">
                support@databounty.sampidia.com
              </a>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/tasks" className="hover:text-[#029FFC] transition-colors">
                  Browse Available Bounties
                </Link>
              </li>
              <li>
                <Link href="/creator" className="hover:text-[#029FFC] transition-colors">
                  Creator Campaign Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#029FFC] transition-colors">
                  Profile & Bank Account Setup
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Verification Guarantee */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-[#029FFC]" />
              Automated Payout Engine
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Google Forms with Option 1 Google Sheet Webhook trigger instant automated wallet payouts as soon as form responses are recorded.
            </p>
            <div className="p-3 bg-[#011438] border border-[#025BE5]/30 rounded-xl text-slate-300 flex items-center justify-between">
              <span>Minimum Payout Threshold:</span>
              <span className="font-bold text-[#029FFC] text-sm">₦100 Naira</span>
            </div>
          </div>

        </div>

        <div className="border-t border-[#025BE5]/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px]">
          <p>© {new Date().getFullYear()} DataBounty Nigeria. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>Built for Nigerian Creators & Testers</span>
            <span>•</span>
            <a href="mailto:support@databounty.sampidia.com" className="hover:text-[#029FFC]">
              Need Help? Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
