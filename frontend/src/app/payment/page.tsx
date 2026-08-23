"use client";

import React, { useState } from"react";
import { api } from"@/services/api";
import { CreatePaymentRequest, PaymentResponse } from"@/types";
import { Card, CardHeader, CardTitle, CardContent } from"@/components/ui/Card";
import { Button } from"@/components/ui/Button";
import { Input } from"@/components/ui/Input";
import { Badge } from"@/components/ui/Badge";
import { RiskGauge } from"@/components/risk/RiskGauge";
import { SignalBreakdown } from"@/components/risk/SignalBreakdown";
import { InterventionPanel } from"@/components/risk/InterventionPanel";
import { Loader2, Send, BadgeCheck, FileWarning, Shuffle, ScanLine } from"lucide-react";
import { RiskRadarChart } from"@/components/risk/RiskRadarChart";

import { DEMO_SCENARIOS, DemoScenario } from"@/utils/scenarios";

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

 if (includeContext && transcript.trim() !=="") {
 payload.interaction_context = {
 transcript: transcript,
 channel:"voice",
 };
 }

 try {
 const data = await api.createPayment(payload);
 setResponse(data);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message :"Payment analysis failed");
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
 <div className="space-y-8 max-w-[1280px] mx-auto">
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
 <div className="flex-1">
 <h1 data-animate="header"className="text-[32px] font-bold tracking-tight flex items-center gap-3 text-white">
 <div className="w-12 h-12 -2xl bg-blue-500/15 flex items-center justify-center">
 <ScanLine className="w-6 h-6 text-white"/>
 </div>
 Payment Simulator
 </h1>
 <p data-animate="description"className="text-sm text-white mt-1">Simulate UPI transactions and evaluate multi-signal risk fusion in real time.</p>
 </div>
 <div data-animate="panel"className="flex-1 max-w-md">
 <h3 className="text-[12px] font-mono font-semibold text-white mb-2 uppercase tracking-widest">Demo Scenarios</h3>
 <div className="flex flex-wrap gap-2">
 {DEMO_SCENARIOS.map((scenario) => (
 <Badge 
 key={scenario.id}
 data-animate="control"
 variant={activeScenario?.id === scenario.id ?"default":"outline"} 
 className="cursor-pointer transition-all"
 onClick={() => loadScenario(scenario)}
 >
 {scenario.name}
 </Badge>
 ))}
 </div>
 {activeScenario && (
 <div data-animate="card"className="mt-3 p-4 bg-[#1C1C1E] -2xl text-sm text-white">
 <p className="font-semibold text-white mb-1">{activeScenario.name}</p>
 <p className="leading-relaxed text-xs text-white">{activeScenario.description}</p>
 <p className="mt-2 text-[12px] text-white font-mono">Expected Risk: <strong className="text-white">{activeScenario.expectedResult.level}</strong></p>
 </div>
 )}
 </div>
 </div>

 <div className="grid md:grid-cols-[1fr_2fr] gap-8">
 
 {/* Left Column: Form */}
 <Card data-animate="panel"className="h-fit">
 <CardHeader>
 <CardTitle className="text-white text-lg">Transaction Details</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white ml-1">Amount (INR)</label>
 <div className="relative">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-medium z-10 pointer-events-none text-xs">₹</div>
 <Input 
 type="number"
 value={amount} 
 onChange={e => setAmount(e.target.value)} 
 required 
 placeholder="Amount (INR)"
 className="pl-8 font-mono"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white ml-1">User ID</label>
 <div className="relative">
 <Input 
 value={userId} 
 onChange={e => setUserId(e.target.value)} 
 required 
 placeholder="User ID"
 className="font-mono text-xs"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white ml-1">Device Fingerprint</label>
 <div className="relative">
 <Input 
 value={deviceId} 
 onChange={e => setDeviceId(e.target.value)} 
 required 
 placeholder="Device Fingerprint"
 className="font-mono text-xs"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-white ml-1">Recipient ID</label>
 <div className="relative">
 <Input 
 value={recipientId} 
 onChange={e => setRecipientId(e.target.value)} 
 required 
 placeholder="Recipient ID"
 className="font-mono text-xs"
 />
 </div>
 </div>
 </div>

 <div className="pt-4 border-t">
 <div className="flex items-center gap-3 mb-3">
 <input 
 type="checkbox"
 id="context"
 checked={includeContext} 
 onChange={e => setIncludeContext(e.target.checked)} 
 className=" bg-[#1C1C1E] text-white focus:ring-blue-500 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="context"className="text-sm font-medium text-white cursor-pointer">
 Simulate Interaction Context
 </label>
 </div>
 {includeContext && (
 <textarea 
 className="w-full h-28 -xl border border-white/15 bg-[#1C1C1E] p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors placeholder:text-neutral-500 font-mono text-xs"
 placeholder="Enter synthetic interaction transcript..."
 value={transcript}
 onChange={e => setTranscript(e.target.value)}
 />
 )}
 {includeContext && (
 <div className="text-[12px] text-white mt-2 flex items-center gap-1.5">
 <BadgeCheck className="w-4 h-4 text-emerald-400"/> Transcript processed locally for demonstration.
 </div>
 )}
 </div>

 <div className="flex gap-3 mt-4 pt-2">
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
 <Shuffle className="w-4 h-4"/>
 Randomize
 </Button>
 <Button type="submit"disabled={loading} className="w-1/2 flex gap-2">
 {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
 Analyze
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>

 {/* Right Column: Results */}
 <div className="space-y-6">
 {error && (
 <Card className="bg-red-500/10">
 <CardContent className="pt-6 text-red-300">
 <h3 className="font-semibold mb-1 text-red-200">Analysis Failed</h3>
 <p className="text-sm">{error}</p>
 </CardContent>
 </Card>
 )}

 {!response && !loading && !error && (
 <div className="h-full min-h-[400px] border-dashed bg-[#1C1C1E] -2xl flex flex-col items-center justify-center text-white p-8 text-center">
 <div className="w-12 h-12 -2xl bg-[#1C1C1E] flex items-center justify-center mb-4 text-white">
 <FileWarning className="w-6 h-6"/>
 </div>
 <h3 className="text-base font-semibold text-white">Waiting for transaction</h3>
 <p className="text-xs mt-1.5 max-w-sm leading-relaxed text-white">
 Initiate a payment on the left to observe the multi-signal risk analysis and fusion process.
 </p>
 </div>
 )}

 {loading && (
 <div className="h-full min-h-[300px] -2xl bg-[#1C1C1E] flex flex-col items-center justify-center text-white p-8">
 <Loader2 className="w-10 h-10 animate-spin mb-3 text-white"/>
 <p className="font-semibold animate-pulse text-white text-base">Running Intelligence Pipeline...</p>
 <p className="text-xs text-white mt-1 font-mono">Evaluating behavioral rules, ML models, and interaction signals</p>
 </div>
 )}

 {response && (
 <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
 
 {/* Header Score & Decision */}
 <Card>
 <CardContent className="pt-6 grid md:grid-cols-[1fr_2fr] gap-6 items-center">
 <RiskGauge 
 score={response.risk_evaluation.final_risk_score} 
 level={response.risk_evaluation.risk_level} 
 />
 <div>
 <div className="mb-2">
 <span className="text-[12px] font-mono font-semibold text-white uppercase tracking-widest">Risk Decision</span>
 <h2 className="text-[28px] font-bold mt-0.5 text-white tracking-tight">
 {response.risk_evaluation.risk_level} Risk
 </h2>
 </div>
 <div className="flex flex-wrap gap-2 mt-4 font-mono">
 <Badge variant="outline">Engine: {response.risk_evaluation.evaluation_version}</Badge>
 <Badge variant="outline">Status: {response.transaction.status}</Badge>
 <Badge variant="outline">ID: {response.transaction.id.substring(0,8)}</Badge>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Signal Breakdown */}
 <div>
 <h3 className="text-[18px] font-semibold mb-3 text-white">Multi-Signal Intelligence</h3>
 <SignalBreakdown evaluation={response.risk_evaluation} />
 <div className="mt-4">
 <RiskRadarChart evaluation={response.risk_evaluation} />
 </div>
 </div>

 {/* Intervention Action */}
 <div>
 <h3 className="text-[18px] font-semibold mb-3 text-white">Intervention Protocol</h3>
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
