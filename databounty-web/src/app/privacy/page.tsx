import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | DataBounty Nigeria',
  description: 'DataBounty Nigeria Privacy Policy compliant with the Nigeria Data Protection Act (NDPA) and NDPR regulations.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#011438] text-slate-200">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 w-full">
        {/* Page Header */}
        <div className="border-b border-[#025BE5]/20 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#025BE5]/20 text-[#029FFC] text-xs font-bold border border-[#025BE5]/30">
            <ShieldCheck className="w-4 h-4" />
            <span>NDPA / NDPR Compliant Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            DataBounty Nigeria Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Last updated: September 18, 2026 • Governing Nigeria Data Protection Act (NDPA)
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#029FFC]" />
              1. Information We Collect
            </h2>
            <p>
              DataBounty collects personal data directly from creators and testers operating in Nigeria to facilitate bounty verification, demographic targeting, and payout processing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li><strong>Account Credentials:</strong> Full Name, Email Address, Phone Number, and Account Role (Creator / Tester).</li>
              <li><strong>Demographic Profile Data:</strong> Gender, Nigerian State of Residence, Device Brand, Device Model, and OS Version.</li>
              <li><strong>Financial &amp; Payout Data:</strong> Bank Name, Account Number (NUBAN), and Account Name for automated Naira withdrawals via Paystack/Flutterwave integrations.</li>
              <li><strong>Verification Proofs:</strong> Secret confirmation codes, uploaded proof screenshots, and Google Form submission logs.</li>
            </ul>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#029FFC]" />
              2. How We Use Your Personal Data
            </h2>
            <p>
              Under the Nigeria Data Protection Act (NDPA), your personal data is processed lawfully and transparently for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>Matching testers with relevant campaign target demographics (e.g. State-level and gender-level task filtering).</li>
              <li>Automated verification of Google Form responses via secure Webhooks.</li>
              <li>Disbursing task bounty rewards directly to tester wallet balances and processing bank withdrawals.</li>
              <li>Preventing fraudulent claims, duplicate submissions, and automated bot activities.</li>
              <li>Sending transaction updates, security alerts, and withdrawal notifications via email.</li>
            </ul>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#029FFC]" />
              3. Data Protection &amp; Security Measures
            </h2>
            <p>
              We implement industry-standard security protocols to protect your personal data against unauthorized access, loss, or disclosure:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>All database transmissions are encrypted using SSL/TLS 1.3 encryption.</li>
              <li>Financial transactions are handled through certified PCI-DSS compliant Nigerian payment gateways.</li>
              <li>We do not sell, rent, or trade user demographic data to third-party advertisers.</li>
              <li>Creation proof screenshots are processed via secure image hosting APIs.</li>
            </ul>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#029FFC]" />
              4. Your Rights Under NDPR
            </h2>
            <p>
              As a Data Subject residing in Nigeria, you hold the following rights:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li>Right to request access to all personal data stored in your DataBounty profile.</li>
              <li>Right to rectify incorrect bank details or demographic profile information.</li>
              <li>Right to request deletion of your account and personal data from our active systems.</li>
              <li>Right to object to automated processing of task claims.</li>
            </ul>
          </section>

          <section className="glass-panel p-6 rounded-2xl border border-[#025BE5]/25 space-y-3">
            <h2 className="text-lg font-bold text-white">5. Contact Our Data Protection Team</h2>
            <p className="text-xs">
              If you have any questions regarding this Privacy Policy or wish to exercise your NDPR data rights, please contact our Data Protection Office at:
            </p>
            <div className="p-4 bg-[#011438] border border-[#025BE5]/30 rounded-xl font-mono text-xs text-[#029FFC]">
              Email: support@databounty.sampidia.com<br />
              Entity: DataBounty Platform Nigeria<br />
              Location: Lagos, Nigeria
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
