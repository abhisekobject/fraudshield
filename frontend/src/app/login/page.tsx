"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, AlertCircle, User as UserIcon, KeyRound, ChevronRight, Fingerprint, Cpu, Network } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      login(data.access_token, username, data.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "guest", password: "" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Guest authentication failed");
      }

      login(data.access_token, "guest", data.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#f5f5f7] relative overflow-hidden font-body">
      <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10 mx-4">
        <div className="flex flex-col items-center mb-10">
          <Fingerprint className="w-[48px] h-[48px] text-[#1d1d1f] mb-4" strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">FraudShield</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-xl flex gap-3 text-red-600 text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1d1d1f] block">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 rounded-xl py-3.5 pl-12 pr-4 text-[#1d1d1f] text-base outline-none transition-all placeholder:text-[#86868b]"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1d1d1f] block">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#d2d2d7] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 rounded-xl py-3.5 pl-12 pr-4 text-[#1d1d1f] text-base outline-none transition-all placeholder:text-[#86868b]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full mt-4 bg-[#1d1d1f] hover:bg-black disabled:opacity-50 disabled:hover:bg-[#1d1d1f] text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>Sign In</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="text-[#0071e3] hover:underline disabled:opacity-50 text-sm font-medium transition-all"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
