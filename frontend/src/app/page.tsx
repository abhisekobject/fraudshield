"use client";

import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { HealthResponse } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Activity, Brain, Server, Shield, Loader2, AlertCircle, CreditCard, Mic } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to connect to backend");
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">System Dashboard</h1>
        <p className="text-slate-400 mt-2 text-lg">Real-time status of the FraudShield intelligence engines.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900">Backend Connection Failed</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <p className="text-red-700 text-sm mt-2 font-medium">Please ensure the FastAPI backend is running on port 8000.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {health && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Core API</CardTitle>
                <Server className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">ONLINE</div>
                <p className="text-xs text-slate-500 mt-1">v{health.version}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Rule Engine</CardTitle>
                <Activity className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">ACTIVE</div>
                <p className="text-xs text-slate-500 mt-1">Deterministic signals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">ML Engine</CardTitle>
                <Brain className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white uppercase">{health?.services?.ml_engine ?? "Unavailable"}</div>
                <p className="text-xs text-slate-500 mt-1">Synthetic demonstration model</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">NLP Intelligence</CardTitle>
                <Shield className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">ACTIVE</div>
                <p className="text-xs text-slate-500 mt-1">Pattern analysis online</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6 text-white">Quick Actions</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Link href="/payment" className="group">
                <Card className="hover:border-[#444] hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-xl text-white mb-2">Simulate Payment</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Trigger the full Risk Fusion v2 pipeline by initiating a simulated payment.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/interaction" className="group">
                <Card className="hover:border-[#444] hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-xl text-white mb-2">Test NLP Analyzer</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Test the Social Engineering interaction intelligence in isolation.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
