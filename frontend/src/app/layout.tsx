import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Shield, LayoutDashboard, CreditCard, Mic, ActivitySquare } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FraudShield | Security Interface",
  description: "Explainable Real-Time Fraud Shield for UPI & Voice Phishing",
};

function Sidebar() {
  return (
    <div className="w-64 bg-[#0a0a0a] text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-[#222] z-50">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="relative">
          <Shield className="w-8 h-8 text-emerald-400 relative z-10" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">FraudShield</span>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-[#1f1f1f] hover:text-white transition-all group">
          <LayoutDashboard className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link href="/payment" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-[#1f1f1f] hover:text-white transition-all group">
          <CreditCard className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
          <span className="font-medium">Simulator</span>
        </Link>
        <Link href="/interaction" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-[#1f1f1f] hover:text-white transition-all group">
          <Mic className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          <span className="font-medium">Voice Analysis</span>
        </Link>
        <Link href="/analyst" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-[#1f1f1f] hover:text-white transition-all group">
          <ActivitySquare className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          <span className="font-medium">Analyst</span>
        </Link>
      </nav>
      <div className="p-6 space-y-4">
        <div className="bg-[#1a1a1a] rounded-md p-4 text-xs border border-[#2a2a2a]">
          <p className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            POC MODE
          </p>
          <p className="text-slate-500 font-medium tracking-wide">SOAIDEATHON-S40</p>
        </div>
        
        <div className="bg-[#1a1a1a] rounded-md p-4 text-xs text-slate-500 border border-[#2a2a2a]">
          <p className="font-semibold text-slate-300 mb-1">Local Processing</p>
          <p>Transcripts are processed entirely on-device.</p>
        </div>
      </div>
    </div>
  );
}

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BackendStatusBanner } from "@/components/ui/BackendStatusBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-slate-100 antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-emerald-500/30`}>
        <BackendStatusBanner />
        <div className="flex flex-1 relative">
          {/* Sidebar logic handles mobile/desktop via fixed positioning */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
          
          <main className="md:pl-64 flex-1 w-full">
            <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto mt-16 md:mt-0">
              {/* Mobile header placeholder for actual mobile nav button if added later */}
              <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] z-40 border-b border-[#222] flex items-center px-4">
                <Shield className="w-6 h-6 text-emerald-400 mr-2" />
                <span className="font-bold text-lg text-white">FraudShield</span>
              </div>
              
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
