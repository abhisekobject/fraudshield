"use client";

import Link from "next/link";
import { Fingerprint, Radar, ScanLine, AudioLines, ScanEye } from "lucide-react";
import { TileIcon } from "./TileIcon";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const getNavClass = (path: string, hoverColorGroup: string) => {
    const isActive = pathname === path;
    return `group flex items-center gap-3 px-4 py-3 rounded-[6px] font-medium transition-colors ${
      isActive 
        ? `bg-[#1f1f1f] text-white` 
        : `text-ink-muted hover:bg-[#1f1f1f] hover:text-white`
    } ${hoverColorGroup}`;
  };

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
      </nav>

      <div className="p-4 space-y-4 mb-4">
        <div className="bg-black/20 rounded-[8px] p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500 font-bold text-xs">POC MODE</span>
          </div>
          <p className="text-ink-muted text-xs font-medium">SOAIDEATHON-S40</p>
        </div>

        <div className="bg-black/20 rounded-[8px] p-4 text-xs text-ink-muted">
          <p className="font-semibold text-white mb-1">Local Processing</p>
          <p>Transcripts are processed entirely on-device.</p>
        </div>
      </div>
    </div>
  );
}
