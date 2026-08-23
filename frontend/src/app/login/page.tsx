"use client";

import React, { useState } from"react";
import { useAuth } from"@/contexts/AuthContext";
import { CrowdCanvas } from"@/components/CrowdCanvas";
import {
 Loader2,
 AlertCircle,
 KeyRound,
 Shield,
 Eye,
 EyeOff,
 Lock,
 ArrowRight,
 CheckCircle2,
 Sparkles,
 User,
} from"lucide-react";

// ── Local credential database ──────────────────────────────────────────────
const USER_DB: Record<string, { password: string; role: string; displayName: string }> = {
 pratyushsahoo: { password:"pratyush@123", role:"analyst", displayName:"Pratyush Sahoo" },
 abhisekpatra: { password:"abhisek@123", role:"analyst", displayName:"Abhisek Patra" },
 shubhashreepanda: { password:"shubhashree@123", role:"analyst", displayName:"Shubhashree Panda" },
 hariomnanda: { password:"hariom@123", role:"analyst", displayName:"Hariom Nanda" },
 dharmeshpati: { password:"dharmesh@123", role:"analyst", displayName:"Dharmesh Pati" },
 dipankarswain: { password:"dipankar@123", role:"analyst", displayName:"Dipankar Swain" },
 // Guest fallback
 guest: { password:"", role:"analyst", displayName:"Guest Analyst" },
};

export default function LoginPage() {
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [rememberMe, setRememberMe] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [successMsg, setSuccessMsg] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [modalMode, setModalMode] = useState<"forgot" | null>(null);

 const { login } = useAuth();

 const handleLogin = (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 setSuccessMsg(null);
 setLoading(true);

 setTimeout(() => {
 const user = USER_DB[username.trim().toLowerCase()];
 if (user && user.password === password) {
 login(`local-token-${username}`, user.displayName, user.role);
 } else {
 setError("Invalid username or password. Please try again.");
 setLoading(false);
 }
 }, 400);
 };

 const handleGuestLogin = () => {
 setError(null);
 setLoading(true);
 setTimeout(() => {
 login("demo-guest-token-fs","Guest Analyst","analyst");
 }, 300);
 };

 return (
 <div className="relative min-h-screen w-full bg-[#070913] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden font-body selection:bg-purple-500/30">

 {/* ── Background Layer ── */}
 <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
 <div className="w-full h-full opacity-25 filter contrast-125 brightness-90">
 <CrowdCanvas
 src="/images/peeps/all-peeps.png"
 rows={15}
 cols={7}
 className="absolute bottom-0 left-0 w-full h-[85vh] sm:h-[90vh]"
 />
 </div>
 </div>

 {/* Glow overlays */}
 <div className="absolute inset-0 z-[1] pointer-events-none">
 <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-purple-600/15 -full blur-[140px]"/>
 <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-indigo-600/15 -full blur-[150px]"/>
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/10 -full blur-[130px]"/>
 <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-[#070913]/80"/>
 </div>

 {/* ── Login Form ── */}
 <div className="relative z-10 w-full max-w-sm">
 <div className="-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 space-y-6">

 {/* Brand */}
 <div className="flex items-center gap-3 mb-2">
 <Shield className="w-6 h-6 text-white" />
 <span className="text-2xl font-bold tracking-tight text-white">FraudShield</span>
 </div>

 {/* Error */}
 {error && (
 <div className="p-3 bg-red-500/10 -xl flex items-start gap-2 text-red-300 text-xs animate-in fade-in border border-red-500/20">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
 <p>{error}</p>
 </div>
 )}

 {/* Success */}
 {successMsg && (
 <div className="p-3 bg-emerald-500/10 -xl flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
 <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
 <p>{successMsg}</p>
 </div>
 )}

 {/* Form */}
 <form onSubmit={handleLogin} className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60 block">Username</label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
 <input
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="e.g. abhisekpatra"
 required
 className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-0 -xl py-3 pl-10 pr-4 text-white text-sm outline-none transition-all placeholder:text-white/25"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white/60 block">Password</label>
 <div className="relative">
 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
 <input
 type={showPassword ?"text" :"password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••••••"
 required
 className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-0 -xl py-3 pl-10 pr-11 text-white text-sm outline-none transition-all placeholder:text-white/25"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
 >
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between text-xs">
 <label className="flex items-center gap-2 cursor-pointer text-white/50 hover:text-white/70 transition-colors select-none">
 <input
 type="checkbox"
 checked={rememberMe}
 onChange={(e) => setRememberMe(e.target.checked)}
 className="w-3.5 h-3.5 accent-purple-500 cursor-pointer"
 />
 <span>Remember me</span>
 </label>
 <button
 type="button"
 onClick={() => setModalMode("forgot")}
 className="text-white/50 hover:text-white transition-colors cursor-pointer"
 >
 Forgot password?
 </button>
 </div>

 <button
 type="submit"
 disabled={loading || !username || !password}
 className="w-full bg-white text-black font-semibold py-3 px-6 -xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer text-sm hover:bg-white/90 group"
 >
 {loading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <>
 <Lock className="w-4 h-4" />
 <span>Sign in</span>
 <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
 </>
 )}
 </button>
 </form>

 {/* Divider */}
 <div className="relative text-center">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-white/10" />
 </div>
 <span className="relative px-3 text-[10px] uppercase tracking-wider text-white/30 font-mono">or</span>
 </div>

 {/* Demo button */}
 <button
 type="button"
 onClick={handleGuestLogin}
 disabled={loading}
 className="w-full flex items-center justify-center gap-2 py-2.5 px-4 -xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-medium text-white transition-all cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>Continue as Demo Guest</span>
 </button>

 </div>
 </div>

 {/* Forgot Password Modal */}
 {modalMode ==="forgot" && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in">
 <div className="w-full max-w-md bg-[#0f132a] border border-white/10 -2xl p-6 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-white font-bold">
 <Shield className="w-5 h-5" />
 <span>Forgot Password</span>
 </div>
 <button onClick={() => setModalMode(null)} className="text-white/50 hover:text-white text-sm px-2 py-1 cursor-pointer">✕</button>
 </div>
 <p className="text-xs text-white/60 leading-relaxed">
 Contact your FraudShield workspace security administrator or reach out to the team to reset your credentials.
 </p>
 <div className="flex justify-end pt-2">
 <button
 onClick={() => setModalMode(null)}
 className="px-4 py-2 -xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
