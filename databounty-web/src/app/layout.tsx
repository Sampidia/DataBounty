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
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "DataBounty - Micro-Tasking & QA Testing Platform",
    description: "Earn naira by testing digital products or hire vetted Nigerian QA testers.",
    images: ["/Databounty_logo.webp"],
  },
};

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
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

