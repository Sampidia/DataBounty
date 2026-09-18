import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { AuthModal } from "@/components/AuthModal";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DataBounty - Nigeria's Premier Micro-Tasking & QA Testing Platform",
  description: "Empowering Nigerian testers and creators. Post bounties, complete micro-tasks, test apps, and earn naira securely with instant escrow settlement.",
  keywords: ["DataBounty", "QA Testing Nigeria", "Earn Money Online Nigeria", "Micro Tasks", "App Testing", "Tester Escrow", "Flutterwave Escrow"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "DataBounty - Nigeria's Premier Micro-Tasking & QA Testing Platform",
    description: "Earn naira by completing micro-tasks & testing app products, or hire vetted Nigerian testers with automated escrow payouts.",
    url: "https://databounty.sampidia.com",
    siteName: "DataBounty Nigeria",
    images: [
      {
        url: "/databounty-og.png",
        width: 1200,
        height: 630,
        alt: "DataBounty Nigeria Social Preview",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataBounty - Paid Micro-Testing Platform",
    description: "Post bounty tasks, complete surveys & app testing, and cash out to any Nigerian bank.",
    images: ["/databounty-og.png"],
  },
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#011438] text-white">
        <AuthProvider>
          <Script src="https://checkout.flutterwave.com/v3.js" strategy="afterInteractive" />
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

