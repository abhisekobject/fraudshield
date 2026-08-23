"use client";

import React from"react";
import { usePathname } from"next/navigation";
import { BottomNav } from"@/components/ui/BottomNav";
import { BackendStatusBanner } from"@/components/ui/BackendStatusBanner";
import { ErrorBoundary } from"@/components/ui/ErrorBoundary";
import { PageTransition } from"@/components/ui/PageTransition";
import { Shield } from"lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const isLoginPage = pathname ==="/login";

 // Login page has its own self-contained experience and canvas background
 if (isLoginPage) {
 return <ErrorBoundary>{children}</ErrorBoundary>;
 }

 return (
 <div className="relative min-h-screen bg-black text-white overflow-x-hidden selection:bg-blue-500/20">

 <div className="relative z-10 flex flex-col min-h-screen">
 <BackendStatusBanner />

 {/* Mobile top header bar for quick brand identification */}
 <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-[#1C1C1E] z-40 border-b flex items-center justify-between px-4">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 -lg bg-blue-500/20 flex items-center justify-center">
 <Shield className="w-4 h-4 text-white"/>
 </div>
 <span className="font-semibold text-base text-white tracking-tight">FraudShield</span>
 </div>
 <span className="text-[10px] font-mono text-white bg-blue-500/10 px-2 py-0.5 -full">
 POC MODE
 </span>
 </header>

 <main className="flex-1 w-full pb-28 md:pb-32">
 <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto w-full">
 <ErrorBoundary>
 <PageTransition key={pathname}>
 {children}
 </PageTransition>
 </ErrorBoundary>
 </div>
 </main>

 {/* Floating Bottom Navigation Bar */}
 <BottomNav />
 </div>
 </div>
 );
}


