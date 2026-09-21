import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, ShieldAlert, CheckCircle, Scale, Coins } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | DataBounty Nigeria',
  description: 'DataBounty Nigeria Platform Terms and Conditions for Creators and Testers.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#011438] text-slate-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 w-full">
        {/* Page Header */}
        <div className="border-b border-[#025BE5]/20 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#025BE5]/20 text-[#029FFC] text-xs font-bold border border-[#025BE5]/30">
            <Scale className="w-4 h-4" />
            <span>Platform Agreement &amp; Operating Rules</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Effective Date: September 18, 2026 • DataBounty Nigeria Services
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#029FFC]" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using DataBounty Nigeria (&quot;the Platform&quot;), whether as a Task Creator or QA Tester, you agree to be bound by these Terms &amp; Conditions and our Privacy Policy.
            </p>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#029FFC]" />
              2. Creator Escrow &amp; Campaign Rules
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>Creators must fund total task budget into Escrow before campaigns become active.</li>
              <li>A non-refundable creator service fee applies based on campaign budget tiers (₦50 for budgets under ₦10,000; ₦100 for under ₦50,000; ₦500 for ₦50,000 and above).</li>
              <li>Creators choosing Option 1 Automated Webhook verification agree that valid Google Form submissions will be credited automatically.</li>
              <li>Creators choosing Option 2 Manual Verification must review pending submissions within a reasonable timeframe.</li>
            </ul>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#029FFC]" />
              3. Tester Obligations &amp; Payout Terms
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>Testers must complete tasks authentically without using bots, VPNs, or automated scripts.</li>
              <li>Duplicate submissions for the same campaign by the same user account are strictly prohibited.</li>
              <li>Rewards earned are credited to the tester&apos;s wallet balance upon verification approval.</li>
              <li>Withdrawals to Nigerian NUBAN bank accounts require a minimum gross withdrawal of ₦150 (₦100 minimum net payout to tester + ₦50 processing fee). A flat withdrawal processing fee applies (₦50 under ₦10,000; ₦100 above ₦10,000).</li>
            </ul>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#029FFC]" />
              4. Prohibited Activities &amp; Termination
            </h2>
            <p className="text-xs">
              DataBounty reserves the right to suspend or terminate accounts that engage in fraudulent claims, submit fake screenshots, abuse the Google Form Webhook API, or attempt to exploit platform balances.
            </p>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white">5. Governing Law</h2>
            <p className="text-xs">
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
