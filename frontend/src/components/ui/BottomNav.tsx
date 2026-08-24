"use client";

import { useState, useCallback } from"react";
import Link from"next/link";
import { 
 Radar, 
 ScanLine, 
 AudioLines, 
 ScanEye, 
 Smartphone, 
 RotateCcw, 
 CheckCircle2, 
 Loader2, 
 Shield, 
 LogOut,
 XCircle,
 User as UserIcon
} from"lucide-react";
import { usePathname } from"next/navigation";
import { api } from"@/services/api";
import { useAuth } from"@/contexts/AuthContext";
import { cn } from"@/utils/cn";

const navItems = [
 { href:"/", label:"Dashboard", icon: Radar },
 { href:"/payment", label:"Simulator", icon: ScanLine },
 { href:"/interaction", label:"Voice Analysis", icon: AudioLines },
 { href:"/analyst", label:"Analyst", icon: ScanEye },
 { href:"/mobile", label:"Mobile App", icon: Smartphone },
];

export function BottomNav() {
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
 <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[96%] sm:w-[92%] max-w-[1400px] pointer-events-auto">
  <div className="h-[68px] md:h-[74px] bg-white/70 backdrop-blur-xl rounded-[20px] md:rounded-[24px] border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] px-3 sm:px-5 md:px-6 flex items-center justify-between gap-2 md:gap-4 text-black">
  
  {/* Left: Brand Logo */}
  <Link 
  href="/"
  className="flex items-center gap-2.5 shrink-0 group hover:opacity-80 transition-opacity"
  >
  {/* Custom FraudShield Mark: Minimal and complex shield */}
  <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
      {/* Abstract outer shield */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* Internal intersecting lines for complexity */}
      <path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      {/* Diamond in the center */}
      <path d="M12 8l4 4-4 4-4-4 4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Core dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  </div>
  <div className="hidden xl:flex flex-col">
  <span className="font-bold text-[15px] tracking-tight text-black leading-tight">FraudShield</span>
  </div>
 </Link>

 {/* Center: Navigation Links */}
 <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-1">
 {navItems.map(({ href, label, icon: Icon }) => {
 const isActive = pathname === href;
 return (
 <Link
 key={href}
 href={href}
 className={cn(
 "relative flex items-center gap-2 px-2.5 sm:px-3 md:px-4 py-2 rounded-xl text-[13px] md:text-[14px] font-bold transition-all duration-200 shrink-0",
  isActive
  ?"bg-black/10 text-black"
  :"text-gray-500 hover:bg-black/5 hover:text-black border-transparent"
  )}
  >
  <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ?"text-black":"text-gray-500 group-hover:text-black")} strokeWidth={isActive ? 2.5 : 2} />
  <span className="hidden sm:inline tracking-wide">{label}</span>
  {isActive && (
  <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-black ml-0.5"/>
  )}
 </Link>
 );
 })}
 </nav>

  {/* Right: User / Session Actions */}
  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
  
  {/* User profile / Guest pill */}
  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5">
  <div className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center">
  <UserIcon className="w-3.5 h-3.5 text-black"/>
  </div>
  <div className="flex flex-col pr-1 text-left">
  <span className="text-[11px] font-bold text-black leading-tight">
  {user ? user.username : "Guest Mode"}
  </span>
  <span className="text-[9px] text-gray-500 font-medium">
  {user ? user.role : "Read Only"}
  </span>
  </div>
  </div>

  <div className="w-px h-8 bg-black/10 hidden lg:block mx-1"></div>

  {/* Reset Session */}
  <button 
  onClick={handleReset}
  disabled={resetState !== 'idle'}
  title="Reset Demo Data"
  className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors text-black disabled:opacity-50"
  >
  {resetState === 'idle' && <RotateCcw className="w-4 h-4" strokeWidth={2.5}/>}
  {resetState === 'loading' && <Loader2 className="w-4 h-4 animate-spin"/>}
  {resetState === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2.5}/>}
  {resetState === 'error' && <XCircle className="w-4 h-4 text-red-600" strokeWidth={2.5}/>}
  </button>

  {/* Logout */}
  {user && (
  <button 
  onClick={logout}
  title="Logout"
  className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors text-red-600"
  >
  <LogOut className="w-4 h-4" strokeWidth={2.5}/>
  </button>
  )}
  </div>

 </div>
 </div>
 );
}
