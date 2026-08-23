"use client";

import React, { useEffect, useState } from"react";
import { api } from"@/services/api";
import { HealthResponse, RiskEventSummary, RiskEventStatistics, RiskLevel } from"@/types";
import {
 DatabaseZap, 
 ListTree, 
 Network, 
 MessageSquareWarning,
 Loader2, 
 AlertCircle, 
 ScanLine, 
 AudioLines,
 ChevronRight, 
 Shield, 
 Activity, 
 Zap,
 Radio,
 Globe2,
 ShieldCheck,
 ShieldAlert,
 ArrowUpRight,
 Clock,
 Layers,
 Cpu,
 Fingerprint,
 PhoneCall,
 Sparkles,
 Server,
 Terminal
} from"lucide-react";
import { Gauge } from"@/components/ui/Gauge";
import { AnimatedCounter } from"@/components/ui/AnimatedCounter";
import { Badge } from"@/components/ui/Badge";
import Link from"next/link";
import { cn } from"@/utils/cn";

export default function Dashboard() {
 const [health, setHealth] = useState<HealthResponse | null>(null);
 const [events, setEvents] = useState<RiskEventSummary[]>([]);
 const [stats, setStats] = useState<RiskEventStatistics | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<"all"|"details">("all");

 useEffect(() => {
 async function loadDashboardData() {
 try {
 const [healthData, eventsData, statsData] = await Promise.allSettled([
 api.getHealth(),
 api.getRiskEvents(1, 6),
 api.getRiskEventStatistics(),
 ]);

 if (healthData.status ==="fulfilled") {
 setHealth(healthData.value);
 } else {
 setError(healthData.reason?.message ||"Failed to connect to backend");
 }

 if (eventsData.status ==="fulfilled") {
 setEvents(eventsData.value.items || []);
 }

 if (statsData.status ==="fulfilled") {
 setStats(statsData.value);
 }
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message :"Failed to load dashboard pipeline data");
 } finally {
 setLoading(false);
 }
 }

 loadDashboardData();
 }, []);

 return (
 <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">

 {/* ── 1. Hero Command Center Banner ──────────────────────────────────── */}
 <div 
 data-animate="panel"
 className="relative overflow-hidden rounded-[24px] bg-[#1C1C1E] p-6 sm:p-8 md:p-10 text-white _20px_50px_rgba(0,0,0,0.4)]"
 >
 {/* Subtle ambient corner glow */}
 <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"/>
 <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"/>

 <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-4">
 
 {/* Headline */}
 <h1
 data-animate="header"
 className="text-white font-bold tracking-tight leading-none"
 style={{
 fontSize:"clamp(48px, 8vw, 80px)",
 letterSpacing:"-0.04em",
 }}
 >
 FraudShield
 </h1>

 {/* API Documentation Links */}
 <div data-animate="header" className="flex items-center justify-center gap-4 pt-4 mt-4 w-full border-t border-white/10">
 <a 
 href="http://localhost:8000/api/docs" 
 target="_blank" 
 rel="noopener noreferrer"
 className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm font-medium transition-all flex items-center gap-2"
 >
 <Terminal className="w-4 h-4" />
 Swagger Docs
 </a>
 <a 
 href="http://localhost:8000/api/redoc" 
 target="_blank" 
 rel="noopener noreferrer"
 className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm font-medium transition-all flex items-center gap-2"
 >
 <Terminal className="w-4 h-4" />
 ReDoc API
 </a>
 </div>

 </div>
 </div>

 {/* Loading State */}
 {loading && (
 <div className="flex items-center justify-center p-12">
 <div className="flex flex-col items-center gap-3">
 <Loader2 className="w-8 h-8 animate-spin text-white"/>
 <span className="text-sm text-white font-mono">Connecting to FraudShield security pipeline...</span>
 </div>
 </div>
 )}

 {/* Error Banner */}
 {error && !loading && (
 <div 
 data-animate="panel"
 className="bg-red-500/10 -2xl p-5 flex items-start gap-4"
 >
 <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0"/>
 <div>
 <h3 className="font-semibold text-red-300 text-sm">Backend Connection Failed</h3>
 <p className="text-red-400 text-xs sm:text-sm mt-1">{error}</p>
 <p className="text-white text-xs mt-2 font-mono">Please ensure the FastAPI backend is running on port 8000.</p>
 </div>
 </div>
 )}

 {/* ── 2. Primary Operational Cards Grid ───────────────────────────────── */}
 <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
 
 {/* Card 1: System Health & Ingress Integrity */}
 <div 
 data-animate="card"
 className="bg-[#1C1C1E] rounded-[22px] p-5 sm:p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300"
 >
 <div>
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
 <Activity className="w-3.5 h-3.5"/> System Health
 </span>
 <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 rounded-full px-2.5 py-0.5 text-[11px] font-mono">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
 LIVE
 </span>
 </div>
 <div className="flex items-baseline gap-2 mb-1">
 <span className="text-[28px] font-bold text-white tracking-tight">Online</span>
 <span className="text-xs font-mono text-white">v{health?.version ||"1.0.0"}</span>
 </div>
 <span className="text-xs text-white capitalize font-mono">{health?.environment ??"production"} node cluster</span>
 </div>
 
 <div data-animate="chart"className="my-5">
 <Gauge value={100} color="#3b82f6"showLabels min="Offline"max="Optimal"/>
 </div>

 {/* Toggle pill */}
 <div data-animate="control"className="flex bg-[#1C1C1E] rounded-xl p-1">
 <button 
 onClick={() => setActiveTab("all")}
 className={cn(
"flex-1 text-[12px] py-1.5 px-3 -lg font-medium transition-all cursor-pointer",
 activeTab ==="all"
 ?"bg-blue-600/30 text-white"
 :"text-white hover:text-white"
 )}
 >
 All Systems
 </button>
 <button 
 onClick={() => setActiveTab("details")}
 className={cn(
"flex-1 text-[12px] py-1.5 px-3 -lg font-medium transition-all cursor-pointer",
 activeTab ==="details"
 ?"bg-blue-600/30 text-white"
 :"text-white hover:text-white"
 )}
 >
 Pipeline Specs
 </button>
 </div>
 </div>

 {/* Card 2: Real-Time Engine Matrix */}
 <div 
 data-animate="card"
 className="bg-[#1C1C1E] rounded-[22px] p-5 sm:p-6 flex flex-col justify-between gap-4 hover:border-white/20 transition-all duration-300"
 >
 <div className="flex items-center justify-between pb-1 border-b">
 <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
 <Cpu className="w-3.5 h-3.5"/> Engine Status Matrix
 </span>
 <span className="text-xs text-white font-mono">4 Services Online</span>
 </div>

 <div className="space-y-1">
 {[
 { label:"Core API Pipeline", icon: DatabaseZap, status:"Active", detail:`v${health?.version ||"1.0.0"}`, color:"text-white", bg:"bg-blue-500/10", border:""},
 { label:"Deterministic Rule Matrix", icon: ListTree, status:"Active", detail:"Real-time heuristics", color:"text-emerald-400", bg:"bg-emerald-500/10", border:""},
 { label:"XGBoost ML Engine", icon: Network, status: health?.services?.ml_engine ??"Active", detail:"Vector inference", color:"text-white", bg:"bg-purple-500/10", border:""},
 { label:"Voice NLP Intelligence", icon: MessageSquareWarning, status:"Active", detail:"Phishing heuristics", color:"text-white", bg:"bg-cyan-500/10", border:""},
 ].map(({ label, icon: Icon, status, detail, color, bg, border }) => (
 <div key={label} className="flex items-center gap-3 py-2.5 border-b last:border-0">
 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", bg, border)}>
 <Icon className={cn("w-4 h-4", color)} strokeWidth={2} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-[13px] font-semibold text-white truncate">{label}</div>
 <div className="text-[11px] text-white font-mono">{detail}</div>
 </div>
 <span className="text-[11px] font-mono font-medium px-2 py-0.5 -md bg-emerald-500/15 text-emerald-300 shrink-0">
 ● {status}
 </span>
 </div>
 ))}
 </div>

 <div className="pt-2 text-[11px] text-white font-mono flex items-center justify-between border-t">
 <span>Latency: <strong className="text-white">~14ms</strong></span>
 <span>Uptime: <strong className="text-emerald-400">99.99%</strong></span>
 </div>
 </div>

 {/* Card 3: Defense Posture & Monitored Vectors */}
 <div 
 data-animate="card"
 className="bg-[#1C1C1E] rounded-[22px] p-5 sm:p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300"
 >
 <div>
 <div className="flex items-center justify-between mb-3 pb-1 border-b">
 <span className="text-xs font-mono uppercase tracking-wider text-white font-semibold flex items-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5"/> Threat Defense Posture
 </span>
 <span className="text-[11px] font-mono text-white font-medium">Shield V2.4</span>
 </div>

 <div className="p-3.5 -2xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 mb-4">
 <div className="flex items-center gap-2 mb-1">
 <Shield className="w-4 h-4 text-white"/>
 <span className="text-xs font-semibold text-white">Posture: Optimal Shielding</span>
 </div>
 <p className="text-[11px] text-white leading-relaxed font-mono">
 Multi-channel fusion enabled for UPI streams, device biometric integrity, and live voice transcripts.
 </p>
 </div>

 <div className="space-y-2.5">
 <div className="flex items-center justify-between text-xs py-1.5 border-b">
 <span className="text-white flex items-center gap-2">
 <Fingerprint className="w-3.5 h-3.5 text-white"/> Device Fingerprint
 </span>
 <span className="font-mono text-emerald-400 font-bold">100% Protected</span>
 </div>
 <div className="flex items-center justify-between text-xs py-1.5 border-b">
 <span className="text-white flex items-center gap-2">
 <PhoneCall className="w-3.5 h-3.5 text-white"/> Voice Call Intercept
 </span>
 <span className="font-mono text-white font-bold">Real-Time Sync</span>
 </div>
 <div className="flex items-center justify-between text-xs py-1.5 border-b">
 <span className="text-white flex items-center gap-2">
 <Zap className="w-3.5 h-3.5 text-white"/> Mule Graph Traversal
 </span>
 <span className="font-mono text-white font-bold">Continuous</span>
 </div>
 </div>
 </div>

 <div className="pt-4 mt-2">
 <Link 
 href="/payment"
 className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-white text-xs font-semibold transition-all group cursor-pointer"
 >
 <span>Launch Simulator</span>
 <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-"/>
 </Link>
 </div>
 </div>

 </div>

 {/* ── 3. Live Threat Map & Ingress Topology Section ────────────────────── */}
 <div 
 data-animate="panel"
 className="-[24px] bg-[#1C1C1E] p-5 sm:p-7 _20px_50px_rgba(0,0,0,0.35)] space-y-5"
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
 <div className="space-y-1">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center">
 <Globe2 className="w-4 h-4 text-white"/>
 </div>
 <div>
 <h3 className="text-base font-bold text-white tracking-tight">Live Threat Map &amp; Ingress Topology</h3>
 <p className="text-xs text-white">Real-time network security nodes, telemetry ingress, and traffic flow distribution.</p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-white flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"/>
 NODE TOPOLOGY ACTIVE
 </span>
 </div>
 </div>

 {/* Cluster Nodes + Ingress Metrics */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start mt-5">
 <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 { name:"Ingress North", ping:"14ms", status:"Clean", color:"text-emerald-400", bg:"bg-emerald-500/10"},
 { name:"Core West", ping:"18ms", status:"Clean", color:"text-white", bg:"bg-cyan-500/10"},
 { name:"Mesh South", ping:"22ms", status:"Clean", color:"text-white", bg:"bg-blue-500/10"},
 { name:"Gateway East", ping:"16ms", status:"Clean", color:"text-white", bg:"bg-purple-500/10"},
 ].map((cluster, i) => (
 <div key={i} className="p-3 rounded-xl bg-black/40 space-y-1 border">
 <div className="flex items-center gap-1.5">
 <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", cluster.bg.replace('/10',''))} />
 <span className="text-[11.5px] font-semibold text-white">{cluster.name}</span>
 </div>
 <div className="text-[10px] font-mono text-white">Ping: {cluster.ping}</div>
 <span className={cn("text-[9.5px] font-mono px-1.5 py-0.5 inline-block", cluster.bg, cluster.color)}>
 {cluster.status}
 </span>
 </div>
 ))}
 </div>
 <div className="space-y-3">
 <div className="p-4 -2xl bg-black/40 space-y-2 border">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono text-white">Clean Traffic Ratio</span>
 <span className="text-xs font-mono text-emerald-400 font-bold">99.98%</span>
 </div>
 <div className="w-full h-1.5 rounded-full bg-[#1C1C1E] overflow-hidden">
 <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-[99.98%]"/>
 </div>
 </div>
 <div className="p-4 -2xl bg-black/40 space-y-2 border">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono text-white">Packet Inspection Rate</span>
 <span className="text-xs font-mono text-white font-bold">100% In-Line</span>
 </div>
 <div className="w-full h-1.5 rounded-full bg-[#1C1C1E] overflow-hidden">
 <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full w-full"/>
 </div>
 </div>
 <div className="p-4 -2xl bg-black/40 space-y-2 border">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono text-white">Heuristic Signal Match</span>
 <span className="text-xs font-mono text-white font-bold">Real-Time Vector</span>
 </div>
 <div className="w-full h-1.5 rounded-full bg-[#1C1C1E] overflow-hidden">
 <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full w-full"/>
 </div>
 </div>
 </div>
 </div>

 </div>

 {/* ── 4. Recent Detections & Risk Analytics Section ───────────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
 
 {/* Left: Recent Detections */}
 <div 
 data-animate="panel"
 className="-[24px] bg-[#1C1C1E] p-5 sm:p-6 _20px_50px_rgba(0,0,0,0.35)] space-y-4"
 >
 <div className="flex items-center justify-between pb-3 border-b">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-white"/>
 <h3 className="text-base font-bold text-white tracking-tight">Recent Detections</h3>
 </div>
 <Link 
 href="/analyst"
 className="text-[11.5px] font-mono text-white hover:text-white flex items-center gap-1 transition-colors"
 >
 View Full Queue <ChevronRight className="w-3.5 h-3.5"/>
 </Link>
 </div>

 {events.length > 0 ? (
 <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
 {events.map((ev) => {
 const isHigh = ev.risk_level === RiskLevel.HIGH || ev.risk_level === RiskLevel.CRITICAL;
 const isMed = ev.risk_level === RiskLevel.MEDIUM;

 return (
 <div
 key={ev.id}
 className={cn(
"p-3.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-3",
 isHigh
 ?"bg-red-500/10 hover:bg-red-500/15"
 : isMed
 ?"bg-amber-500/10 hover:bg-amber-500/15"
 :"bg-[#1C1C1E] hover:bg-[#1C1C1E]"
 )}
 >
 <div className="flex items-center gap-3 min-w-0">
 <div className={cn(
"w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
 isHigh ?"bg-red-500/20 text-red-400":"bg-[#1C1C1E] text-white"
 )}>
 {isHigh ? <ShieldAlert className="w-4 h-4"/> : <ShieldCheck className="w-4 h-4 text-emerald-400"/>}
 </div>
 <div className="min-w-0">
 <div className="text-xs font-semibold text-white truncate font-mono">
 TX: {ev.transaction_id ? ev.transaction_id.slice(0, 12) +"...":"Direct Stream"}
 </div>
 <div className="text-[11px] text-white font-mono mt-0.5">
 ₹{ev.amount.toLocaleString()} • {new Date(ev.evaluated_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'})}
 </div>
 </div>
 </div>

 <div className="text-right shrink-0">
 <Badge
 variant={
 ev.risk_level === RiskLevel.LOW ?"low":
 ev.risk_level === RiskLevel.MEDIUM ?"medium":
 ev.risk_level === RiskLevel.HIGH ?"high":"critical"
 }
 >
 {ev.risk_level}
 </Badge>
 <div className="text-[10px] font-mono text-white mt-1">
 Score: {Math.round(ev.risk_score * 100)}/100
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="min-h-[220px] -2xl border-dashed bg-[#1C1C1E] flex flex-col items-center justify-center p-6 text-center space-y-2">
 <ShieldCheck className="w-8 h-8 text-emerald-400"/>
 <h4 className="text-sm font-semibold text-white">System Operating Nominally</h4>
 <p className="text-xs text-white max-w-xs leading-relaxed">
 No active threats flagged in recent transactions. Use Simulator or Voice Analysis to generate live test events.
 </p>
 </div>
 )}
 </div>

 {/* Right: Risk Trend & Distribution Statistics */}
 <div 
 data-animate="panel"
 className="-[24px] bg-[#1C1C1E] p-5 sm:p-6 _20px_50px_rgba(0,0,0,0.35)] space-y-4"
 >
 <div className="flex items-center justify-between pb-3 border-b">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-white"/>
 <h3 className="text-base font-bold text-white tracking-tight">Risk Metrics &amp; Distribution</h3>
 </div>
 <span className="text-[11px] font-mono text-white">Real-Time Evaluation</span>
 </div>

 {/* Metric Stats Tiles */}
 <div className="grid grid-cols-2 gap-3.5">
 <div className="p-4 -2xl bg-[#1C1C1E] space-y-1">
 <span className="text-[11px] font-mono text-white uppercase tracking-wider">Total Risk Events</span>
 <div className="text-2xl font-bold font-mono text-white">
 <AnimatedCounter value={stats?.total_events ?? 0} />
 </div>
 <span className="text-[10.5px] text-white font-mono">Multi-signal audited</span>
 </div>

 <div className="p-4 -2xl bg-[#1C1C1E] space-y-1">
 <span className="text-[11px] font-mono text-white uppercase tracking-wider">Reviewed Cases</span>
 <div className="text-2xl font-bold font-mono text-emerald-400">
 <AnimatedCounter value={stats?.reviewed_count ?? 0} />
 </div>
 <span className="text-[10.5px] text-emerald-300 font-mono">Analyst calibrated</span>
 </div>

 <div className="p-4 -2xl bg-[#1C1C1E] space-y-1">
 <span className="text-[11px] font-mono text-white uppercase tracking-wider">Confirmed Fraud</span>
 <div className="text-2xl font-bold font-mono text-red-400">
 <AnimatedCounter value={stats?.true_positive_count ?? 0} />
 </div>
 <span className="text-[10.5px] text-red-300 font-mono">Mitigated in-line</span>
 </div>

 <div className="p-4 -2xl bg-[#1C1C1E] space-y-1">
 <span className="text-[11px] font-mono text-white uppercase tracking-wider">False Positive Rate</span>
 <div className="text-2xl font-bold font-mono text-white">
 {stats?.false_positive_rate !== undefined && stats.false_positive_rate !== null ? (
 <AnimatedCounter value={stats.false_positive_rate * 100} decimals={1} suffix="%"/>
 ) : (
"0.0%"
 )}
 </div>
 <span className="text-[10.5px] text-white font-mono">Friction minimal</span>
 </div>
 </div>

 {/* Quick Launch Shortcuts */}
 <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 <Link
 href="/interaction"
 className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1E] hover:bg-[#1C1C1E] text-xs font-semibold text-white transition-all group"
 >
 <div className="flex items-center gap-2">
 <AudioLines className="w-4 h-4 text-white"/>
 <span>Voice Phishing Analyzer</span>
 </div>
 <ChevronRight className="w-4 h-4 text-white group-hover:text-white group-hover:translate-x-0.5 transition-all"/>
 </Link>

 <Link
 href="/analyst"
 className="flex items-center justify-between p-3 rounded-xl bg-[#1C1C1E] hover:bg-[#1C1C1E] text-xs font-semibold text-white transition-all group"
 >
 <div className="flex items-center gap-2">
 <Layers className="w-4 h-4 text-white"/>
 <span>Audit &amp; Feedback Queue</span>
 </div>
 <ChevronRight className="w-4 h-4 text-white group-hover:text-white group-hover:translate-x-0.5 transition-all"/>
 </Link>
 </div>
 </div>

 </div>

 </div>
 );
}
