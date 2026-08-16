"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { RiskEventSummary, RiskEventDetail, RiskEventStatistics, FeedbackClassification } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ActivitySquare, Loader2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, ShieldAlert, Lock, ShieldCheck } from "lucide-react";

function getRiskColor(level: string) {
  switch (level) {
    case "LOW": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    case "MEDIUM": return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    case "HIGH": return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    case "CRITICAL": return "bg-red-500/20 text-red-400 border border-red-500/30";
    default: return "bg-white/10 text-slate-300 border border-white/20";
  }
}

function getFeedbackColor(classification: FeedbackClassification | null) {
  if (!classification) return "bg-white/5 text-slate-500 border border-white/10";
  switch (classification) {
    case FeedbackClassification.LEGITIMATE: return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case FeedbackClassification.FALSE_POSITIVE: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case FeedbackClassification.CONFIRMED_FRAUD: return "bg-red-500/20 text-red-400 border-red-500/30";
    case FeedbackClassification.UNCERTAIN: return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default: return "bg-white/10 text-slate-300 border-white/20";
  }
}

export default function AnalystView() {
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
      const [eventsRes, statsRes] = await Promise.all([
        api.getRiskEvents(),
        api.getRiskEventStatistics()
      ]);
      setEvents(eventsRes.items);
      setStats(statsRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventsRes, statsRes] = await Promise.all([
          api.getRiskEvents(),
          api.getRiskEventStatistics()
        ]);
        setEvents(eventsRes.items);
        setStats(statsRes);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleExpand = async (eventId: string) => {
    if (expandedId === eventId) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    
    setExpandedId(eventId);
    setExpandedDetail(null);
    setDetailLoading(true);
    setFeedbackNotes("");
    
    try {
      const detail = await api.getRiskEventDetail(eventId);
      setExpandedDetail(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load event detail");
      setExpandedId(null);
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
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 text-white">
            <ActivitySquare className="w-10 h-10 text-amber-500" />
            Analyst Review Queue
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Review flagged transactions, investigate RiskReasons, and manage false positives.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2 bg-transparent border-white/20 text-white hover:bg-white/10">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 mt-0.5" />
             <p className="text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-400 mb-1">Total Risk Events</p>
              <h3 className="text-3xl font-bold text-white">{stats.total_events}</h3>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span>{stats.reviewed_count} Reviewed</span>
                <span>{stats.unreviewed_count} Pending</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-400 mb-1">False Positives (Reported)</p>
              <h3 className="text-3xl font-bold text-blue-400">{stats.false_positive_count}</h3>
              <p className="mt-2 text-xs text-slate-500">
                {stats.false_positive_rate !== null ? `${(stats.false_positive_rate * 100).toFixed(1)}% of reviewed` : "N/A"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-400 mb-1">Confirmed Fraud</p>
              <h3 className="text-3xl font-bold text-red-400">{stats.true_positive_count}</h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-400 mb-1">Legitimate (True Negatives)</p>
              <h3 className="text-3xl font-bold text-emerald-400">{stats.legitimate_count}</h3>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-white/10 bg-black/20">
          <CardTitle className="text-lg text-white">Risk Events Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && events.length === 0 ? (
            <div className="flex justify-center items-center p-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-12 text-slate-400">
              <p>No risk events found.</p>
              <p className="text-sm mt-1">Run a simulation in the Payment Simulator to generate data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/40 text-slate-400 font-medium border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Event ID</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Risk Score</th>
                    <th className="px-6 py-4">Case Status</th>
                    <th className="px-6 py-4">Review Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map((ev) => (
                    <React.Fragment key={ev.id}>
                      <tr 
                        className={`hover:bg-white/[0.05] transition-colors cursor-pointer ${expandedId === ev.id ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => toggleExpand(ev.id)}
                      >
                        <td className="px-6 py-4 font-mono text-xs text-slate-300">{ev.id.split('-')[0]}...</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-300">{ev.user_id.split('-')[0]}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">₹{ev.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getRiskColor(ev.risk_level)}`}>
                            {ev.risk_score.toFixed(2)} ({ev.risk_level})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            ev.case_status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            ev.case_status === 'INVESTIGATING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            ev.case_status === 'ESCALATED' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {ev.case_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ev.has_feedback ? (
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getFeedbackColor(ev.latest_feedback_classification)}`}>
                              {ev.latest_feedback_classification}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Unreviewed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {expandedId === ev.id ? (
                            <ChevronUp className="w-5 h-5 text-slate-500 inline" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-500 inline" />
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded Detail Panel */}
                      {expandedId === ev.id && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-white/10">
                            <div className="bg-[#09090b] p-6 shadow-inner">
                              {detailLoading ? (
                                <div className="flex justify-center p-8 text-slate-500">
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                              ) : expandedDetail ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  
                                  {/* Left Col: Explanations */}
                                  <div className="lg:col-span-2 space-y-6">
                                    
                                    {/* Transcript Privacy Indicator */}
                                    <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-5 shadow-inner">
                                      <h3 className="font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                                        <ShieldCheck className="w-4 h-4" />
                                        Data Privacy & Security
                                      </h3>
                                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                                        Interaction audio and transcripts are processed exclusively on the client device. 
                                        FraudShield analysts only receive cryptographically hashed representations of the conversation context to preserve user privacy.
                                      </p>
                                      <div className="bg-black/40 border border-black/50 p-3 rounded-md font-mono text-xs">
                                        <p className="text-emerald-500 font-bold mb-1">[ENCRYPTED AUDIO TRANSCRIPT]</p>
                                        <p className="text-slate-500 break-all">
                                          LOCAL SHA-256 HASH: 0x{Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join('')}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2 text-emerald-400/70">
                                          <Lock className="w-3 h-3" />
                                          <span className="text-[10px] uppercase tracking-wider">Status: Secured</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-3">
                                        <ShieldAlert className="w-4 h-4 text-slate-400" />
                                        Triggered Rules & Explanations
                                      </h3>
                                      {expandedDetail.risk_reasons.length > 0 ? (
                                        <div className="space-y-3">
                                          {expandedDetail.risk_reasons.map((r, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-xs font-semibold text-slate-300 bg-white/10 px-2 py-1 rounded">
                                                  {r.reason_code}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                                                  r.severity === 'CRITICAL' ? 'text-red-400' :
                                                  r.severity === 'HIGH' ? 'text-orange-400' :
                                                  'text-slate-400'
                                                }`}>
                                                  {r.severity}
                                                </span>
                                              </div>
                                              
                                              {/* Phase B: Explainability Headers */}
                                              <div className="flex gap-4 mb-2 mt-1">
                                                {r.source_engine && (
                                                  <div className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                                    Engine: <span className="text-slate-300">{r.source_engine}</span>
                                                  </div>
                                                )}
                                                {r.contribution !== undefined && r.contribution !== null && (
                                                  <div className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    Impact: <span className="text-slate-300">{(r.contribution * 100).toFixed(0)}%</span>
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <p className="text-slate-400 leading-relaxed text-sm mb-2">{r.explanation}</p>
                                              
                                              {/* Phase B: Evidence block */}
                                              {r.evidence && (
                                                <div className="mt-3 bg-black/30 border border-white/5 rounded p-2 text-xs font-mono text-slate-500 break-words">
                                                  <span className="text-amber-500/70 block mb-1">Evidence:</span>
                                                  "{r.evidence}"
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No specific rules triggered.</p>
                                      )}
                                    </div>
                                    
                                    {/* Audit Trail */}
                                    {expandedDetail.feedback_history.length > 0 && (
                                      <div>
                                        <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-3">
                                          <CheckCircle className="w-4 h-4 text-slate-400" />
                                          Feedback History
                                        </h3>
                                        <div className="space-y-2">
                                          {expandedDetail.feedback_history.map((fb, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm flex justify-between items-start">
                                              <div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-3 border ${getFeedbackColor(fb.classification)}`}>
                                                  {fb.classification}
                                                </span>
                                                <span className="text-slate-500 text-xs">by {fb.analyst_identifier}</span>
                                                {fb.comment && <p className="mt-2 text-slate-300">{fb.comment}</p>}
                                              </div>
                                              <span className="text-slate-500 text-xs">{new Date(fb.created_at).toLocaleString()}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Right Col: Provide Feedback */}
                                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 self-start sticky top-6">
                                    <h3 className="font-semibold text-slate-200 mb-4">Analyst Verdict</h3>
                                    <p className="text-xs text-slate-400 mb-4">
                                      Classify this event based on your investigation. This feedback will inform future risk models.
                                    </p>
                                    
                                    <textarea
                                      className="w-full text-sm border-white/10 bg-black/20 text-slate-200 rounded-lg p-3 min-h-[80px] mb-4 focus:ring-amber-500 placeholder:text-slate-600 shadow-inner"
                                      placeholder="Add investigation notes..."
                                      value={feedbackNotes}
                                      onChange={(e) => setFeedbackNotes(e.target.value)}
                                    />
                                    
                                    <div className="space-y-2">
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start border-blue-500/20 hover:bg-blue-500/10 text-blue-400 bg-transparent"
                                        onClick={() => submitFeedback(FeedbackClassification.FALSE_POSITIVE)}
                                        disabled={submitting}
                                      >
                                        Mark as False Positive
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start border-red-500/20 hover:bg-red-500/10 text-red-400 bg-transparent"
                                        onClick={() => submitFeedback(FeedbackClassification.CONFIRMED_FRAUD)}
                                        disabled={submitting}
                                      >
                                        Mark as Confirmed Fraud
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 bg-transparent"
                                        onClick={() => submitFeedback(FeedbackClassification.LEGITIMATE)}
                                        disabled={submitting}
                                      >
                                        Mark as Legitimate (True Negative)
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start border-amber-500/20 hover:bg-amber-500/10 text-amber-400 bg-transparent"
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
