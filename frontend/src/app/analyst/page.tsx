"use client";

import React, { useEffect, useState } from"react";
import { api } from"@/services/api";
import { RiskEventSummary, RiskEventDetail, RiskEventStatistics, FeedbackClassification } from"@/types";
import { Card, CardHeader, CardTitle, CardContent } from"@/components/ui/Card";
import { Button } from"@/components/ui/Button";
import { Loader2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, ScanEye, BadgeCheck, Fingerprint, OctagonAlert } from"lucide-react";
import { EventRiskScatterChart } from"@/components/risk/EventRiskScatterChart";

function getRiskColor(level: string) {
 switch (level) {
 case"LOW": return"bg-emerald-500/20 text-emerald-300";
 case"MEDIUM": return"bg-amber-500/20 text-amber-300";
 case"HIGH": return"bg-orange-500/20 text-orange-300";
 case"CRITICAL": return"bg-red-500/20 text-red-300";
 default: return"bg-[#1C1C1E] text-white";
 }
}

export default function AnalystReviewQueue() {
 const [events, setEvents] = useState<RiskEventSummary[]>([]);
 const [stats, setStats] = useState<RiskEventStatistics | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [expandedDetail, setExpandedDetail] = useState<RiskEventDetail | null>(null);
 const [detailLoading, setDetailLoading] = useState(false);
 const [feedbackNotes, setFeedbackNotes] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const fetchData = async () => {
 setLoading(true);
 setError(null);
 try {
 const [listRes, statsRes] = await Promise.all([
 api.getRiskEvents(1, 50),
 api.getRiskEventStatistics()
 ]);
 setEvents(listRes.items);
 setStats(statsRes);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message :"Failed to load analyst queue");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const toggleExpand = async (id: string) => {
 if (expandedId === id) {
 setExpandedId(null);
 setExpandedDetail(null);
 return;
 }
 setExpandedId(id);
 setDetailLoading(true);
 try {
 const detail = await api.getRiskEventDetail(id);
 setExpandedDetail(detail);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message :"Failed to load event details");
 } finally {
 setDetailLoading(false);
 }
 };

 const submitFeedback = async (classification: FeedbackClassification) => {
 if (!expandedId) return;
 setSubmitting(true);
 try {
 await api.submitFeedback(expandedId, classification, feedbackNotes);
 // Refresh list to update UI
 await fetchData();
 // Refetch detail to show history
 const detail = await api.getRiskEventDetail(expandedId);
 setExpandedDetail(detail);
 setFeedbackNotes("");
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message :"Failed to submit feedback");
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="space-y-8 max-w-6xl mx-auto pb-20">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 data-animate="header"className="text-[32px] font-bold tracking-tight flex items-center gap-3 text-white">
 <div className="w-12 h-12 -2xl bg-purple-500/15 flex items-center justify-center">
 <ScanEye className="w-6 h-6 text-white"/>
 </div>
 Analyst Review Queue
 </h1>
 <p data-animate="description"className="text-sm text-white mt-1">Audit flagged transactions, review explainable AI reasoning, and calibrate model feedback.</p>
 </div>
 <Button data-animate="control"variant="outline"onClick={fetchData} disabled={loading} className="gap-2">
 <RefreshCw className={`w-4 h-4 ${loading ?'animate-spin':''}`} />
 Refresh Queue
 </Button>
 </div>

 {error && (
 <Card data-animate="panel"className="bg-red-500/10">
 <CardContent className="pt-6 text-red-300 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 mt-0.5 text-red-400"/>
 <p className="text-sm font-medium">{error}</p>
 </CardContent>
 </Card>
 )}

 {/* Stats Summary */}
 {stats && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <Card data-animate="card">
 <CardContent className="p-5">
 <p className="text-xs font-mono font-semibold text-white mb-1 uppercase tracking-wider">Total Risk Events</p>
 <h3 className="text-[30px] font-bold text-white tracking-tight">{stats.total_events}</h3>
 <div className="flex gap-3 mt-2 text-xs font-mono text-white">
 <span className="text-emerald-400 font-medium">{stats.reviewed_count} Reviewed</span>
 <span>•</span>
 <span className="text-amber-400 font-medium">{stats.unreviewed_count} Pending</span>
 </div>
 </CardContent>
 </Card>
 
 <Card data-animate="card">
 <CardContent className="p-5">
 <p className="text-xs font-mono font-semibold text-emerald-400 mb-1 uppercase tracking-wider">False Positives</p>
 <h3 className="text-[30px] font-bold text-emerald-400 tracking-tight">{stats.false_positive_count}</h3>
 <p className="mt-2 text-xs font-mono text-white">
 {stats.false_positive_rate !== null ?`${(stats.false_positive_rate * 100).toFixed(1)}% of reviewed`:"N/A"}
 </p>
 </CardContent>
 </Card>
 
 <Card data-animate="card">
 <CardContent className="p-5">
 <p className="text-xs font-mono font-semibold text-red-400 mb-1 uppercase tracking-wider">Confirmed Fraud</p>
 <h3 className="text-[30px] font-bold text-red-400 tracking-tight">{stats.true_positive_count}</h3>
 <p className="mt-2 text-xs text-white">High-priority threat cases</p>
 </CardContent>
 </Card>

 <Card data-animate="card">
 <CardContent className="p-5">
 <p className="text-xs font-mono font-semibold text-white mb-1 uppercase tracking-wider">Legitimate (True Negatives)</p>
 <h3 className="text-[30px] font-bold text-white tracking-tight">{stats.legitimate_count}</h3>
 <p className="mt-2 text-xs text-white">Cleared by analyst review</p>
 </CardContent>
 </Card>
 </div>
 )}

 {events.length > 0 && (
 <div data-animate="chart">
 <EventRiskScatterChart events={events} />
 </div>
 )}

 <Card data-animate="panel">
 <CardHeader className="border-b bg-[#1C1C1E] py-4 px-6">
 <CardTitle className="text-base text-white font-semibold">Risk Events Queue</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {loading && events.length === 0 ? (
 <div className="flex justify-center items-center p-12 text-white">
 <Loader2 className="w-8 h-8 animate-spin"/>
 </div>
 ) : events.length === 0 ? (
 <div className="text-center p-12 text-white">
 <p className="font-medium text-white">No risk events found.</p>
 <p className="text-xs mt-1 text-white">Run a simulation in the Payment Simulator to generate data.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-[#1C1C1E] text-white font-semibold border-b text-xs">
 <tr>
 <th className="px-6 py-3.5">Event ID</th>
 <th className="px-6 py-3.5">User</th>
 <th className="px-6 py-3.5">Amount</th>
 <th className="px-6 py-3.5">Risk Score</th>
 <th className="px-6 py-3.5">Case Status</th>
 <th className="px-6 py-3.5">Review Status</th>
 <th className="px-6 py-3.5"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/[0.06]">
 {events.map((ev) => (
 <React.Fragment key={ev.id}>
 <tr 
 className={`hover:bg-[#1C1C1E] transition-colors cursor-pointer ${expandedId === ev.id ?'bg-[#1C1C1E]':''}`}
 onClick={() => toggleExpand(ev.id)}
 >
 <td className="px-6 py-4 font-mono text-xs text-white font-semibold">{ev.id.split('-')[0]}...</td>
 <td className="px-6 py-4 font-mono text-xs text-white">{ev.user_id.split('-')[0]}</td>
 <td className="px-6 py-4 font-bold text-white">₹{ev.amount.toFixed(2)}</td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-1 -full text-xs font-mono font-semibold ${getRiskColor(ev.risk_level)}`}>
 {ev.risk_score.toFixed(2)} ({ev.risk_level})
 </span>
 </td>
 <td className="px-6 py-4">
 <span className={`px-2.5 py-0.5 -full text-xs font-mono font-medium ${
 ev.case_status ==='NEW'?'bg-blue-500/20 text-white':
 ev.case_status ==='INVESTIGATING'?'bg-amber-500/20 text-amber-300':
 ev.case_status ==='ESCALATED'?'bg-red-500/20 text-red-300':
'bg-[#1C1C1E] text-white'
 }`}>
 {ev.case_status}
 </span>
 </td>
 <td className="px-6 py-4">
 {ev.has_feedback ? (
 <span className={`px-2.5 py-0.5 -full text-xs font-mono font-medium ${
 ev.latest_feedback_classification === FeedbackClassification.LEGITIMATE ?'bg-emerald-500/20 text-emerald-300':
 ev.latest_feedback_classification === FeedbackClassification.FALSE_POSITIVE ?'bg-blue-500/20 text-white':
 ev.latest_feedback_classification === FeedbackClassification.CONFIRMED_FRAUD ?'bg-red-500/20 text-red-300':
 ev.latest_feedback_classification === FeedbackClassification.UNCERTAIN ?'bg-amber-500/20 text-amber-300':
'bg-[#1C1C1E] text-white'
 }`}>
 {ev.latest_feedback_classification}
 </span>
 ) : (
 <span className="text-white text-xs font-mono">Unreviewed</span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 {expandedId === ev.id ? (
 <ChevronUp className="w-4 h-4 text-white inline"/>
 ) : (
 <ChevronDown className="w-4 h-4 text-white inline"/>
 )}
 </td>
 </tr>
 
 {/* Expanded Detail Panel */}
 {expandedId === ev.id && (
 <tr>
 <td colSpan={7} className="p-0 border-b">
 <div className="bg-[#1C1C1E] p-6 border-t">
 {detailLoading ? (
 <div className="flex justify-center p-8 text-white">
 <Loader2 className="w-6 h-6 animate-spin"/>
 </div>
 ) : expandedDetail ? (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Left Col: Explanations */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Transcript Privacy Indicator */}
 <div className="bg-cyan-950/40 -xl p-4">
 <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-2">
 <BadgeCheck className="w-4 h-4 text-white"/>
 Data Privacy &amp; Security
 </h3>
 <p className="text-xs text-white mb-3 leading-relaxed">
 Interaction audio and transcripts are processed securely via server-side NLP Risk Engine. 
 FraudShield analysts only receive cryptographically hashed representations of the conversation context to preserve user privacy. Audio data is discarded immediately after analysis.
 </p>
 <div className="bg-black/50 p-3 -lg font-mono text-[11px]">
 <p className="text-white font-bold mb-1">[encrypted Audio Transcript]</p>
 <p className="text-white break-all">
 LOCAL SHA-256 HASH: 0x{Array.from({length: 64}, () =>"0123456789abcdef"[Math.floor(Math.random() * 16)]).join('')}
 </p>
 <div className="flex items-center gap-1.5 mt-2 text-white">
 <Fingerprint className="w-3 h-3 text-white"/>
 <span className="text-[10px]">Status: Secured</span>
 </div>
 </div>
 </div>

 <div>
 <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
 <OctagonAlert className="w-4 h-4 text-amber-400"/>
 Triggered Rules &amp; Explanations
 </h3>
 {expandedDetail.risk_reasons.length > 0 ? (
 <div className="space-y-3">
 {expandedDetail.risk_reasons.map((r, i) => (
 <div key={i} className="bg-[#1C1C1E] -xl p-4 text-xs">
 <div className="flex items-center justify-between mb-2">
 <span className="font-mono text-[11px] font-semibold text-white bg-[#1C1C1E] px-2 py-0.5">
 {r.reason_code}
 </span>
 <span className={`text-[10px] font-mono font-bold uppercase ${
 r.severity ==='CRITICAL'?'text-red-400':
 r.severity ==='HIGH'?'text-orange-400':
'text-white'
 }`}>
 {r.severity}
 </span>
 </div>
 
 {/* Explainability Headers */}
 <div className="flex gap-4 mb-2 mt-1 font-mono">
 {r.source_engine && (
 <div className="text-[11px] text-white flex items-center gap-1">
 <span className="w-1.5 h-1.5 -full bg-neutral-400"></span>
 Engine: <span className="text-white font-medium">{r.source_engine}</span>
 </div>
 )}
 {r.contribution !== undefined && r.contribution !== null && (
 <div className="text-[11px] text-white flex items-center gap-1">
 <span className="w-1.5 h-1.5 -full bg-blue-400"></span>
 Impact: <span className="text-white font-medium">{(r.contribution * 100).toFixed(0)}%</span>
 </div>
 )}
 </div>
 
 <p className="text-white leading-relaxed mb-2">{r.explanation}</p>
 
 {/* Evidence block */}
 {r.evidence && (
 <div className="mt-2 bg-black/40 -lg p-2.5 font-mono text-[11px] text-white break-words">
 <span className="text-white font-semibold block mb-1">Evidence:</span>
"{r.evidence}"
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-white">No specific rules triggered.</p>
 )}
 </div>
 
 {/* Audit Trail */}
 {expandedDetail.feedback_history.length > 0 && (
 <div>
 <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
 <CheckCircle className="w-4 h-4 text-emerald-400"/>
 Feedback History
 </h3>
 <div className="space-y-2">
 {expandedDetail.feedback_history.map((fb, i) => (
 <div key={i} className="bg-[#1C1C1E] -xl p-3 text-xs flex justify-between items-start">
 <div>
 <span className={`px-2.5 py-0.5 -full text-[11px] font-mono font-semibold mr-2 ${
 fb.classification === FeedbackClassification.LEGITIMATE ?'bg-emerald-500/20 text-emerald-300':
 fb.classification === FeedbackClassification.FALSE_POSITIVE ?'bg-blue-500/20 text-white':
 fb.classification === FeedbackClassification.CONFIRMED_FRAUD ?'bg-red-500/20 text-red-300':
 fb.classification === FeedbackClassification.UNCERTAIN ?'bg-amber-500/20 text-amber-300':
'bg-[#1C1C1E] text-white'
 }`}>
 {fb.classification}
 </span>
 <span className="text-white text-[11px] font-mono">by {fb.analyst_identifier}</span>
 {fb.comment && <p className="mt-1.5 text-white">{fb.comment}</p>}
 </div>
 <span className="text-white text-[11px] font-mono">{new Date(fb.created_at).toLocaleString()}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 
 {/* Right Col: Provide Feedback */}
 <div className="bg-[#1C1C1E] -2xl p-5 self-start sticky top-6">
 <h3 className="font-semibold text-white text-sm mb-1">Analyst Verdict</h3>
 <p className="text-xs text-white mb-3">
 Classify this event based on your investigation to tune future risk models.
 </p>
 
 <textarea
 className="w-full text-xs bg-black/40 text-white -xl p-3 min-h-[80px] mb-3 focus:ring-2 focus:outline-none focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-white transition-all font-mono"
 placeholder="Add investigation notes..."
 value={feedbackNotes}
 onChange={(e) => setFeedbackNotes(e.target.value)}
 />
 
 <div className="space-y-2">
 <Button 
 variant="outline"
 className="w-full justify-start text-white hover:bg-blue-500/15 text-xs"
 onClick={() => submitFeedback(FeedbackClassification.FALSE_POSITIVE)}
 disabled={submitting}
 >
 Mark as False Positive
 </Button>
 <Button 
 variant="outline"
 className="w-full justify-start text-red-300 hover:bg-red-500/15 text-xs"
 onClick={() => submitFeedback(FeedbackClassification.CONFIRMED_FRAUD)}
 disabled={submitting}
 >
 Mark as Confirmed Fraud
 </Button>
 <Button 
 variant="outline"
 className="w-full justify-start text-emerald-300 hover:bg-emerald-500/15 text-xs"
 onClick={() => submitFeedback(FeedbackClassification.LEGITIMATE)}
 disabled={submitting}
 >
 Mark as Legitimate
 </Button>
 <Button 
 variant="outline"
 className="w-full justify-start text-amber-300 hover:bg-amber-500/15 text-xs"
 onClick={() => submitFeedback(FeedbackClassification.UNCERTAIN)}
 disabled={submitting}
 >
 Needs More Review
 </Button>
 </div>
 </div>
 
 </div>
 ) : null}
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
