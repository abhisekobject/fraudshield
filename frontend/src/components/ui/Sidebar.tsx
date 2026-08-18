"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Fingerprint, Radar, ScanLine, AudioLines, ScanEye, Smartphone, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { TileIcon } from "./TileIcon";
import { usePathname } from "next/navigation";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getNavClass = (path: string, hoverColorGroup: string) => {
    const isActive = pathname === path;
    return `group flex items-center gap-3 px-4 py-3 rounded-[6px] font-medium transition-colors ${
      isActive 
        ? `bg-[#1f1f1f] text-white` 
        : `text-ink-muted hover:bg-[#1f1f1f] hover:text-white`
    } ${hoverColorGroup}`;
  };

  type ResetState = "idle" | "loading" | "done" | "error";
  const [resetState, setResetState] = useState<ResetState>("idle");

  const handleReset = useCallback(async () => {
    if (resetState === "loading") return;
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
    <div className="w-[256px] bg-surface text-ink flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 text-ink">
        <div className="relative">
          <Fingerprint className="w-[32px] h-[32px] text-white relative z-10" />
        </div>
        <span className="font-display font-bold text-[20px] tracking-tight text-white">FraudShield</span>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        <Link href="/" className={getNavClass("/", "hover-dashboard")}>
          <TileIcon icon={Radar} className="w-8 h-8 p-1.5" iconClassName="w-full h-full" />
          <span>Dashboard</span>
        </Link>
        <Link href="/payment" className={getNavClass("/payment", "hover-payment")}>
          <TileIcon icon={ScanLine} className="w-8 h-8 p-1.5" iconClassName="w-full h-full" />
          <span>Simulator</span>
        </Link>
        <Link href="/interaction" className={getNavClass("/interaction", "hover-interaction")}>
          <TileIcon icon={AudioLines} className="w-8 h-8 p-1.5" iconClassName="w-full h-full" />
          <span>Voice Analysis</span>
        </Link>
        <Link href="/analyst" className={getNavClass("/analyst", "hover-analyst")}>
          <TileIcon icon={ScanEye} className="w-8 h-8 p-1.5" iconClassName="w-full h-full" />
          <span>Analyst</span>
        </Link>
        <Link href="/mobile" className={getNavClass("/mobile", "hover-mobile")}>
          <TileIcon icon={Smartphone} className="w-8 h-8 p-1.5" iconClassName="w-full h-full" />
          <span>Mobile App</span>
        </Link>
      </nav>

      <div className="p-4 mb-4 space-y-3">
        {/* User Badge */}
        {user && (
          <div className="bg-[#1f1f1f] rounded-[8px] p-3 flex items-center justify-between mb-4 border border-hairline">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-white truncate max-w-[120px]">{user.username}</span>
              <span className="text-[10px] text-emerald-500 uppercase tracking-wider">{user.role}</span>
            </div>
            <button 
              onClick={logout}
              className="text-[10px] text-ink-muted hover:text-white underline underline-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        )}

        {/* Reset Session button */}
        <button
          onClick={handleReset}
          disabled={resetState === "loading"}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] border border-white/20 bg-transparent text-[12px] font-semibold transition-all duration-200 hover:border-white/50 hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {resetState === "loading" && (
            <><Loader2 className="w-3.5 h-3.5 animate-spin text-white" /><span className="text-white">Resetting...</span></>
          )}
          {resetState === "done" && (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Session Reset!</span></>
          )}
          {resetState === "error" && (
            <><RotateCcw className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400">Reset Failed</span></>
          )}
          {resetState === "idle" && (
            <><RotateCcw className="w-3.5 h-3.5 text-ink-muted" /><span className="text-ink-muted">Reset Session</span></>
          )}
        </button>

        {/* POC badge */}
        <div className="bg-transparent border border-white/20 rounded-[8px] p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500 font-bold text-xs">POC MODE</span>
          </div>
          <p className="text-ink-muted text-xs font-medium">SOAIDEATHON-S40</p>
        </div>
      </div>
    </div>
  );
}
