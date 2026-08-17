"use client";

import React, { useState } from "react";
import { api } from "../../services/api";
import { CreatePaymentRequest, PaymentResponse } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { RiskGauge } from "../../components/risk/RiskGauge";
import { SignalBreakdown } from "../../components/risk/SignalBreakdown";
import { InterventionPanel } from "../../components/risk/InterventionPanel";
import { Loader2, Send, BadgeCheck, FileWarning, Shuffle, ScanLine } from "lucide-react";
import { TileIcon } from "../../components/ui/TileIcon";

import { DEMO_SCENARIOS, DemoScenario } from "../../utils/scenarios";

export default function PaymentSimulator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaymentResponse | null>(null);

  // Form State — defaults match the demo UUIDs from reset_demo_data.py
  const [amount, setAmount] = useState("500");
  const [userId, setUserId] = useState("a0000000-0000-0000-0000-000000000001");
  const [deviceId, setDeviceId] = useState("a0000000-0000-0000-0000-000000000010");
  const [recipientId, setRecipientId] = useState("a0000000-0000-0000-0000-000000000020");
  const [includeContext, setIncludeContext] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    const payload: CreatePaymentRequest = {
      user_id: userId,
      recipient_id: recipientId,
      device_id: deviceId,
      amount: parseFloat(amount),
    };

    if (includeContext && transcript.trim() !== "") {
      payload.interaction_context = {
        transcript: transcript,
        channel: "voice",
      };
    }

    try {
      const data = await api.createPayment(payload);
      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    setUserId(scenario.payload.userId);
    setAmount(scenario.payload.amount);
    setRecipientId(scenario.payload.recipientId);
    setDeviceId(scenario.payload.deviceId);
    setIncludeContext(scenario.payload.includeContext);
    setTranscript(scenario.payload.transcript);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1280px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-[36px] font-display font-bold tracking-tight flex items-center gap-3 text-white">
            <TileIcon icon={ScanLine} className="w-16 h-16 bg-white" iconClassName="w-10 h-10 text-blue-500" />
            Payment Simulator
          </h1>
        </div>
        <div className="flex-1 max-w-md">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-ink-muted mb-3">Demo Scenarios</h3>
          <div className="flex flex-wrap gap-2">
            {DEMO_SCENARIOS.map((scenario) => (
              <Badge 
                key={scenario.id}
                variant={activeScenario?.id === scenario.id ? "default" : "outline"} 
                className={`cursor-pointer transition-colors rounded-full px-3 py-1 ${activeScenario?.id === scenario.id ? 'bg-white text-black hover:bg-white/90' : 'hover:bg-[#1f1f1f] text-ink-muted'}`}
                onClick={() => loadScenario(scenario)}
              >
                {scenario.name}
              </Badge>
            ))}
          </div>
          {activeScenario && (
            <div className="mt-4 p-4 bg-surface rounded-[8px] text-sm text-ink-muted border border-hairline shadow-sm">
              <p className="font-semibold text-white mb-2">{activeScenario.name}</p>
              <p className="leading-relaxed">{activeScenario.description}</p>
              <p className="mt-3 text-[12px] text-ink-muted">Expected Risk: <strong className="text-white">{activeScenario.expectedResult.level}</strong></p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        
        {/* Left Column: Form */}
        <Card className="h-fit bg-surface">
          <CardHeader>
            <CardTitle className="text-white">Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-ink-muted">₹</span>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="pl-8 font-mono text-base bg-paper border-hairline text-white focus:border-emerald-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">User ID</label>
                <Input value={userId} onChange={e => setUserId(e.target.value)} required className="font-mono text-sm bg-paper border-hairline text-white focus:border-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">Device Fingerprint</label>
                <Input value={deviceId} onChange={e => setDeviceId(e.target.value)} required className="font-mono text-sm bg-paper border-hairline text-white focus:border-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">Recipient ID</label>
                <Input value={recipientId} onChange={e => setRecipientId(e.target.value)} required className="font-mono text-sm bg-paper border-hairline text-white focus:border-emerald-500" />
              </div>

              <div className="pt-6 border-t border-hairline">
                <div className="flex items-center gap-3 mb-3">
                  <input type="checkbox" id="context" checked={includeContext} onChange={e => setIncludeContext(e.target.checked)} className="rounded border-hairline bg-paper text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                  <label htmlFor="context" className="text-sm font-medium text-white cursor-pointer">Simulate Interaction Context</label>
                </div>
                {includeContext && (
                  <textarea 
                    className="w-full h-28 rounded-[6px] border border-hairline bg-paper p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors placeholder:text-slate-700 shadow-inner" 
                    placeholder="Enter synthetic interaction transcript..."
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                  />
                )}
                {includeContext && (
                  <div className="text-[12px] text-ink-muted mt-2 flex items-center gap-1.5">
                    <TileIcon icon={BadgeCheck} className="w-5 h-5 p-0.5" iconClassName="w-3.5 h-3.5" /> Transcript processed locally for demonstration.
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  disabled={loading} 
                  className="w-1/2 flex gap-2 bg-transparent border-hairline text-white hover:bg-[#1f1f1f]"
                  onClick={() => {
                    const randomScenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
                    loadScenario(randomScenario);
                  }}
                >
                  <Shuffle className="w-4 h-4" />
                  Randomize Values
                </Button>
                <Button type="submit" disabled={loading} className="w-1/2 flex gap-2 bg-blue-500 hover:bg-blue-600 text-white border-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Analyze & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {error && (
            <Card className="border-red-500/30 bg-[#1f0f0f]">
              <CardContent className="pt-6 text-red-400">
                <h3 className="font-semibold mb-1 text-red-400">Analysis Failed</h3>
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {!response && !loading && !error && (
            <div className="h-full min-h-[400px] border border-dashed border-hairline bg-paper rounded-[8px] flex flex-col items-center justify-center text-ink-muted p-8 text-center">
              <TileIcon icon={FileWarning} className="w-12 h-12 mb-4" iconClassName="w-6 h-6" />
              <h3 className="text-lg font-medium text-white">Waiting for transaction</h3>
              <p className="text-sm mt-2 max-w-sm leading-relaxed text-slate-500">
                Initiate a payment on the left to observe the multi-signal risk analysis and fusion process.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[300px] rounded-[8px] flex flex-col items-center justify-center text-emerald-500">
               <Loader2 className="w-[48px] h-[48px] animate-spin mb-4" />
               <p className="font-medium animate-pulse text-emerald-400 text-lg">Running Intelligence Pipeline...</p>
            </div>
          )}

          {response && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Header Score & Decision */}
              <Card className="bg-surface">
                <CardContent className="pt-6 grid md:grid-cols-[1fr_2fr] gap-6 items-center">
                  <RiskGauge 
                    score={response.risk_evaluation.final_risk_score} 
                    level={response.risk_evaluation.risk_level} 
                  />
                  <div>
                    <div className="mb-2">
                      <span className="text-[12px] uppercase tracking-widest font-semibold text-ink-muted">Risk Decision</span>
                      <h2 className="text-[32px] font-display font-bold mt-1 text-white">
                        {response.risk_evaluation.risk_level} Risk
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 font-mono">
                      <Badge variant="outline" className="border-hairline text-slate-400 bg-transparent rounded-[4px]">Engine: {response.risk_evaluation.evaluation_version}</Badge>
                      <Badge variant="outline" className="border-hairline text-slate-400 bg-transparent rounded-[4px]">Status: {response.transaction.status}</Badge>
                      <Badge variant="outline" className="border-hairline text-slate-400 bg-transparent rounded-[4px]">ID: {response.transaction.id.substring(0,8)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signal Breakdown */}
              <div>
                <h3 className="text-[20px] font-semibold mb-4 text-white">Multi-Signal Intelligence</h3>
                <SignalBreakdown evaluation={response.risk_evaluation} />
              </div>

              {/* Intervention Action */}
              <div>
                <h3 className="text-[20px] font-semibold mb-4 text-white">Intervention Protocol</h3>
                <InterventionPanel 
                  evaluation={response.risk_evaluation}
                  onConfirm={async () => { await api.confirmPayment(response.transaction.id) }}
                  onCancel={async () => { await api.cancelPayment(response.transaction.id) }}
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
