import type { Metadata } from"next";
import { Inter } from"next/font/google";
import"./globals.css";
import"@/styles/fonts.css";

import { AuthProvider, AuthGuard } from"@/contexts/AuthContext";
import { AppShell } from"@/components/ui/AppShell";

const inter = Inter({ 
 subsets: ["latin"], 
 variable:"--font-body",
 weight: ["400","500","600","700"]
});

const interDisplay = Inter({ 
 subsets: ["latin"], 
 variable:"--font-display",
 weight: ["500","600","700"]
});

export const metadata: Metadata = {
 title:"FraudShield | Security Interface",
 description:"Explainable Real-Time Fraud Shield for UPI & Voice Phishing",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en">
 <body className={`${interDisplay.variable} ${inter.variable} font-sans text-ink font-body antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-accent-soft bg-[#000000]`}>
 <AuthProvider>
 <AuthGuard>
 <AppShell>
 {children}
 </AppShell>
 </AuthGuard>
 </AuthProvider>
 </body>
 </html>
 );
}
