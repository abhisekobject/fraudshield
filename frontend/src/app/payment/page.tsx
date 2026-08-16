"use client";

import React, { useState } from "react";
import { api } from "../../services/api";
import { CreatePaymentRequest, PaymentResponse } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { RiskScore } from "../../components/risk/RiskScore";
import { SignalBreakdown } from "../../components/risk/SignalBreakdown";
import { InterventionPanel } from "../../components/risk/InterventionPanel";
import { Loader2, ArrowRight, ShieldCheck, ShieldAlert, Dices } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight text-white">Payment Simulator</h1>
          <p className="text-slate-400 mt-2 text-lg">
            Initiate a payment and observe the FraudShield Risk Fusion pipeline in real-time.
          </p>
        </div>
        <div className="flex-1 max-w-md">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Demo Scenarios</h3>
          <div className="flex flex-wrap gap-2">
            {DEMO_SCENARIOS.map((scenario) => (
              <Badge 
                key={scenario.id}
                variant={activeScenario?.id === scenario.id ? "default" : "outline"} 
                className={`cursor-pointer hover:bg-white/10 transition-colors`}
                onClick={() => loadScenario(scenario)}
              >
                {scenario.name}
              </Badge>
            ))}
          </div>
          {activeScenario && (
            <div className="mt-4 p-4 bg-[#141414] rounded-md text-sm text-slate-300 border border-[#2a2a2a] shadow-lg">
              <p className="font-semibold text-white mb-2">{activeScenario.name} Expected Behavior:</p>
              <p className="leading-relaxed">{activeScenario.description}</p>
              <p className="mt-3 text-xs text-slate-500">Expected Risk: <strong className="text-slate-300">{activeScenario.expectedResult.level}</strong></p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        
        {/* Left Column: Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Amount (INR)</label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">User ID</label>
                <Input value={userId} onChange={e => setUserId(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Device Fingerprint</label>
                <Input value={deviceId} onChange={e => setDeviceId(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Recipient ID</label>
                <Input value={recipientId} onChange={e => setRecipientId(e.target.value)} required />
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <input type="checkbox" id="context" checked={includeContext} onChange={e => setIncludeContext(e.target.checked)} className="rounded border-white/10 bg-black/20 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4" />
                  <label htmlFor="context" className="text-sm font-medium text-slate-300 cursor-pointer">Simulate Interaction Context</label>
                </div>
                {includeContext && (
                  <textarea 
                    className="w-full h-28 rounded-md border border-[#333] bg-[#0a0a0a] p-3 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 transition-all placeholder:text-slate-600 shadow-inner" 
                    placeholder="Enter synthetic interaction transcript..."
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                  />
                )}
                {includeContext && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Transcript processed locally for demonstration.
                  </p>
                )}
              </div>

              <div className="flex gap-4 mt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  disabled={loading} 
                  className="w-1/2 flex gap-2"
                  onClick={() => {
                    const randomScenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
                    loadScenario(randomScenario);
                  }}
                >
                  <Dices className="w-4 h-4" />
                  Randomize Values
                </Button>
                <Button type="submit" disabled={loading} className="w-1/2 flex gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Analyze & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {error && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6 text-red-400">
                <h3 className="font-semibold mb-1 text-red-300">Analysis Failed</h3>
                <p className="text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {!response && !loading && !error && (
            <div className="h-full min-h-[400px] border border-dashed border-[#333] bg-[#0a0a0a] rounded-md flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">Waiting for transaction</h3>
              <p className="text-sm mt-2 max-w-sm leading-relaxed">
                Initiate a payment on the left to observe the multi-signal risk analysis and fusion process.
              </p>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[300px] rounded-xl flex flex-col items-center justify-center text-emerald-600">
               <Loader2 className="w-12 h-12 animate-spin mb-4" />
               <p className="font-medium animate-pulse">Running Intelligence Pipeline...</p>
            </div>
          )}

          {response && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Header Score & Decision */}
              <Card>
                <CardContent className="pt-6 grid md:grid-cols-[1fr_2fr] gap-6 items-center">
                  <RiskScore 
                    score={response.risk_evaluation.final_risk_score} 
                    level={response.risk_evaluation.risk_level} 
                  />
                  <div>
                    <div className="mb-2">
                      <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Risk Decision</span>
                      <h2 className="text-3xl font-bold mt-1 text-white">
                        {response.risk_evaluation.risk_level} Risk
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="outline">Engine: {response.risk_evaluation.evaluation_version}</Badge>
                      <Badge variant="outline">Status: {response.transaction.status}</Badge>
                      <Badge variant="outline">ID: {response.transaction.id.substring(0,8)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signal Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Multi-Signal Intelligence</h3>
                <SignalBreakdown evaluation={response.risk_evaluation} />
              </div>

              {/* Intervention Action */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Intervention Protocol</h3>
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
