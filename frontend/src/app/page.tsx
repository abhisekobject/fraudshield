"use client";

import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { HealthResponse } from "../types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { DatabaseZap, ListTree, Network, MessageSquareWarning, Loader2, AlertCircle, ScanLine, AudioLines, Radar, FileCode2, BookOpen } from "lucide-react";
import { TileIcon } from "../components/ui/TileIcon";
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
        <h1 className="text-[36px] font-display font-bold tracking-tight flex items-center gap-3 text-white">
          <TileIcon icon={Radar} className="w-16 h-16 bg-white" iconClassName="w-10 h-10 text-emerald-500" />
          System Dashboard
        </h1>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[12px] font-semibold text-ink-muted">Core API</CardTitle>
                <TileIcon icon={DatabaseZap} />
              </CardHeader>
              <CardContent>
                <div className="text-[24px] font-bold text-emerald-500">Online</div>
                <p className="text-[12px] text-ink-muted mt-1">v{health.version}</p>
              </CardContent>
            </Card>

            <Card className="bg-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[12px] font-semibold text-ink-muted">Rule Engine</CardTitle>
                <TileIcon icon={ListTree} />
              </CardHeader>
              <CardContent>
                <div className="text-[24px] font-bold text-emerald-500">Active</div>
                <p className="text-[12px] text-ink-muted mt-1">Deterministic signals</p>
              </CardContent>
            </Card>

            <Card className="bg-surface lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[12px] font-semibold text-ink-muted">ML Engine</CardTitle>
                <TileIcon icon={Network} />
              </CardHeader>
              <CardContent>
                <div className="text-[24px] font-bold text-white capitalize whitespace-nowrap overflow-hidden text-ellipsis">{health?.services?.ml_engine ?? "Unavailable"}</div>
                <p className="text-[12px] text-ink-muted mt-1">Synthetic demonstration model</p>
              </CardContent>
            </Card>

            <Card className="bg-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[12px] font-semibold text-ink-muted">NLP Intelligence</CardTitle>
                <TileIcon icon={MessageSquareWarning} />
              </CardHeader>
              <CardContent>
                <div className="text-[24px] font-bold text-emerald-500">Active</div>
                <p className="text-[12px] text-ink-muted mt-1">Pattern analysis online</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <h2 className="text-[20px] font-semibold mb-6 text-white">Quick Actions</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Link href="/payment" className="group">
                <Card className="bg-surface transition-colors hover:bg-neutral-900 cursor-pointer h-full">
                  <CardContent className="pt-8 pb-8">
                    <div className="mb-4 transition-transform group-hover:scale-110 w-fit">
                      <TileIcon icon={ScanLine} className="w-12 h-12" iconClassName="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-[20px] text-white mb-2">Simulate Payment</h3>
                    <p className="text-ink-muted text-sm leading-relaxed">
                      Trigger the full Risk Fusion v2 pipeline by initiating a simulated payment.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/interaction" className="group">
                <Card className="bg-surface transition-colors hover:bg-neutral-900 cursor-pointer h-full">
                  <CardContent className="pt-8 pb-8">
                    <div className="mb-4 transition-transform group-hover:scale-110 w-fit">
                      <TileIcon icon={AudioLines} className="w-12 h-12" iconClassName="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-[20px] text-white mb-2">Test NLP Analyzer</h3>
                    <p className="text-ink-muted text-sm leading-relaxed">
                      Test the Social Engineering interaction intelligence in isolation.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-[20px] font-semibold mb-6 text-white">API Documentation</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Link href="http://localhost:8000/api/docs" target="_blank" rel="noopener noreferrer" className="group">
                <Card className="bg-surface transition-colors hover:bg-neutral-900 cursor-pointer h-full">
                  <CardContent className="pt-8 pb-8 flex items-start gap-5">
                    <div className="shrink-0 transition-transform group-hover:scale-110">
                      <TileIcon icon={FileCode2} className="w-12 h-12" iconClassName="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[18px] text-white mb-1">Swagger UI (Interactive)</h3>
                      <p className="text-ink-muted text-sm leading-relaxed">
                        Explore and test the FraudShield REST endpoints interactively via Swagger interface.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="http://localhost:8000/api/redoc" target="_blank" rel="noopener noreferrer" className="group">
                <Card className="bg-surface transition-colors hover:bg-neutral-900 cursor-pointer h-full">
                  <CardContent className="pt-8 pb-8 flex items-start gap-5">
                    <div className="shrink-0 transition-transform group-hover:scale-110">
                      <TileIcon icon={BookOpen} className="w-12 h-12" iconClassName="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[18px] text-white mb-1">ReDoc (Reference)</h3>
                      <p className="text-ink-muted text-sm leading-relaxed">
                        View structured, readable API reference documentation for the risk engine endpoints.
                      </p>
                    </div>
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
