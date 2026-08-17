import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Shield } from "lucide-react";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

// Using Inter for display font as well, matching the design brief
const interDisplay = Inter({ 
  subsets: ["latin"], 
  variable: "--font-display",
  weight: ["600", "700"]
});

const plexMono = IBM_Plex_Mono({ 
  subsets: ["latin"], 
  variable: "--font-mono",
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  title: "FraudShield | Security Interface",
  description: "Explainable Real-Time Fraud Shield for UPI & Voice Phishing",
};

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BackendStatusBanner } from "@/components/ui/BackendStatusBanner";
import { Sidebar } from "@/components/ui/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interDisplay.variable} ${inter.variable} ${plexMono.variable} bg-paper text-ink font-body antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-accent-soft`}>
        <BackendStatusBanner />
        <div className="flex flex-1 relative">
          {/* Sidebar logic handles mobile/desktop via fixed positioning */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          <main className="md:pl-64 flex-1 w-full">
            <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto mt-16 md:mt-0">
              {/* Mobile header placeholder for actual mobile nav button if added later */}
              <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface z-40 border-b border-hairline flex items-center px-4">
                <Shield className="w-6 h-6 text-accent mr-2" />
                <span className="font-display font-semibold text-lg text-ink">FraudShield</span>
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
