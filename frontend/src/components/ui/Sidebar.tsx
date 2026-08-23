"use client";

import { useState, useCallback } from"react";
import Link from"next/link";
import { Radar, ScanLine, AudioLines, ScanEye, Smartphone, RotateCcw, CheckCircle2, Loader2, Shield, LogOut } from"lucide-react";
import { usePathname } from"next/navigation";
import { api } from"@/services/api";
import { useAuth } from"@/contexts/AuthContext";

const navItems = [
 { href:"/", label:"Dashboard", icon: Radar },
 { href:"/payment", label:"Simulator", icon: ScanLine },
 { href:"/interaction", label:"Voice Analysis", icon: AudioLines },
 { href:"/analyst", label:"Analyst", icon: ScanEye },
 { href:"/mobile", label:"Mobile App", icon: Smartphone },
];

export function Sidebar() {
 const pathname = usePathname();
 const { user, logout } = useAuth();

 type ResetState ="idle"|"loading"|"done"|"error";
 const [resetState, setResetState] = useState<ResetState>("idle");

 const handleReset = useCallback(async () => {
 if (resetState ==="loading") return;
 setResetState("loading");
 try {
 await api.resetSession();
 setResetState("done");
 setTimeout(() => setResetState("idle"), 2500);
 } catch {
 setResetState("error");
 setTimeout(() => setResetState("idle"), 2500);
 }
 }, [resetState]);

 return (
 <div className="w-[272px] bg-[#1C1C1E] flex flex-col h-screen fixed left-0 top-0 z-50 border-r text-white">
 {/* Logo */}
 <div className="p-6 pb-5 flex items-center gap-3">
 <div className="w-10 h-10 -xl bg-blue-500/15 flex items-center justify-center">
 <Shield className="w-5 h-5 text-white"strokeWidth={2.5} />
 </div>
 <div className="flex flex-col">
 <span className="font-bold text-[18px] tracking-tight text-white">FraudShield</span>
 <span className="text-[10px] font-mono font-medium text-white uppercase tracking-widest">Security Platform</span>
 </div>
 </div>

 {/* Divider */}
 <div className="mx-5 border-b"/>
 
 {/* Nav items */}
 <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
 {navItems.map(({ href, label, icon: Icon }) => {
 const isActive = pathname === href;
 return (
 <Link
 key={href}
 href={href}
 className={`group flex items-center gap-3 px-3.5 py-2.5 -xl text-[14px] font-medium transition-all duration-200 ${
 isActive
 ?"bg-blue-600/20 text-white"
 :"text-white hover:bg-[#1C1C1E] hover:text-white border-transparent"
 }`}
 >
 <div className={`w-8 h-8 -lg flex items-center justify-center transition-colors ${
 isActive
 ?"bg-blue-500/20 text-white"
 :"bg-[#1C1C1E] text-white group-hover:bg-[#1C1C1E] group-hover:text-white"
 }`}>
 <Icon className="w-4 h-4"strokeWidth={2} />
 </div>
 <span className="tracking-wide">{label}</span>
 {isActive && (
 <div className="ml-auto w-1.5 h-1.5 -full bg-blue-400 animate-pulse"/>
 )}
 </Link>
 );
 })}
 </nav>

 {/* Bottom section */}
 <div className="p-3.5 space-y-2 border-t">
 {/* User badge */}
 {user && (
 <div className="bg-[#1C1C1E] -xl p-3 flex items-center justify-between">
 <div className="flex flex-col min-w-0 mr-2">
 <span className="text-[13px] font-semibold text-white truncate max-w-[130px]">{user.username}</span>
 <span className="text-[10px] text-white uppercase tracking-widest font-mono font-medium">{user.role}</span>
 </div>
 <button 
 onClick={logout}
 className="w-8 h-8 -lg bg-[#1C1C1E] flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-colors text-white cursor-pointer"
 title="Logout"
 >
 <LogOut className="w-3.5 h-3.5"/>
 </button>
 </div>
 )}

 {/* Reset Session */}
 <button
 onClick={handleReset}
 disabled={resetState ==="loading"}
 className="w-full flex items-center justify-center gap-2 px-3 py-2.5 -xl bg-[#1C1C1E] text-[12px] font-semibold text-white transition-all duration-200 hover:bg-[#1C1C1E] hover:border-white/20 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
 >
 {resetState ==="loading"&& (
 <><Loader2 className="w-3.5 h-3.5 animate-spin text-white"/><span className="text-white">Resetting...</span></>
 )}
 {resetState ==="done"&& (
 <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/><span className="text-emerald-400">Session Reset!</span></>
 )}
 {resetState ==="error"&& (
 <><RotateCcw className="w-3.5 h-3.5 text-red-400"/><span className="text-red-400">Reset Failed</span></>
 )}
 {resetState ==="idle"&& (
 <><RotateCcw className="w-3.5 h-3.5 text-white"/><span className="text-white">Reset Session</span></>
 )}
 </button>

 {/* POC badge */}
 <div className="bg-blue-500/10 -xl p-3 flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <span className="relative flex h-2 w-2">
 <span className="animate-ping absolute inline-flex h-full w-full -full bg-blue-400 opacity-75"></span>
 <span className="relative inline-flex -full h-2 w-2 bg-blue-500"></span>
 </span>
 <span className="text-white font-bold text-xs font-mono tracking-wider">POC Mode</span>
 </div>
 <p className="text-white text-xs font-mono">Soaideathon-s40</p>
 </div>
 </div>
 </div>
 );
}
