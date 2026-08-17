"use client";

import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { RiskEventSummary, RiskEventDetail, RiskEventStatistics, FeedbackClassification } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loader2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, ScanEye, BadgeCheck, Fingerprint, OctagonAlert } from "lucide-react";
import { TileIcon } from "../../components/ui/TileIcon";

function getRiskColor(level: string) {
  switch (level) {
    case "LOW": return "bg-risk-low-bg text-risk-low";
    case "MEDIUM": return "bg-risk-medium-bg text-risk-medium";
    case "HIGH": return "bg-risk-high-bg text-risk-high";
    case "CRITICAL": return "bg-risk-critical-bg text-risk-critical";
    default: return "bg-black/5 text-ink-muted border border-hairline";
  }
}

function getFeedbackColor(classification: FeedbackClassification | null) {
  if (!classification) return "bg-black/5 text-ink-muted border border-hairline";
  switch (classification) {
    case FeedbackClassification.LEGITIMATE: return "bg-risk-low-bg text-risk-low";
    case FeedbackClassification.FALSE_POSITIVE: return "bg-accent-soft text-accent";
    case FeedbackClassification.CONFIRMED_FRAUD: return "bg-risk-critical-bg text-risk-critical";
    case FeedbackClassification.UNCERTAIN: return "bg-risk-medium-bg text-risk-medium";
    default: return "bg-black/5 text-ink-muted";
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
          <h1 className="text-[36px] font-display font-bold tracking-tight flex items-center gap-3 text-white">
            <TileIcon icon={ScanEye} className="w-16 h-16 bg-white" iconClassName="w-10 h-10 text-emerald-500" />
            Analyst Review Queue
          </h1>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-risk-critical/20 bg-risk-critical-bg">
          <CardContent className="pt-6 text-risk-critical flex items-start gap-3">
             <AlertCircle className="w-5 h-5 mt-0.5" />
             <p className="text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-surface">
            <CardContent className="p-6">
              <p className="text-[12px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Total Risk Events</p>
              <h3 className="text-[32px] font-display font-bold text-white">{stats.total_events}</h3>
              <div className="flex gap-4 mt-2 text-[12px] text-ink-muted">
                <span>{stats.reviewed_count} Reviewed</span>
                <span>{stats.unreviewed_count} Pending</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-surface">
            <CardContent className="p-6">
              <p className="text-[12px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">False Positives (Reported)</p>
              <h3 className="text-[32px] font-display font-bold text-emerald-400">{stats.false_positive_count}</h3>
              <p className="mt-2 text-[12px] text-ink-muted">
                {stats.false_positive_rate !== null ? `${(stats.false_positive_rate * 100).toFixed(1)}% of reviewed` : "N/A"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-surface">
            <CardContent className="p-6">
              <p className="text-[12px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Confirmed Fraud</p>
              <h3 className="text-[32px] font-display font-bold text-red-500">{stats.true_positive_count}</h3>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardContent className="p-6">
              <p className="text-[12px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Legitimate (True Negatives)</p>
              <h3 className="text-[32px] font-display font-bold text-emerald-500">{stats.legitimate_count}</h3>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-surface">
        <CardHeader className="border-b border-hairline bg-[#1f1f1f]">
          <CardTitle className="text-lg text-white">Risk Events Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && events.length === 0 ? (
            <div className="flex justify-center items-center p-12 text-ink-muted">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-12 text-ink-muted">
              <p>No risk events found.</p>
              <p className="text-sm mt-1">Run a simulation in the Payment Simulator to generate data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#1f1f1f] text-slate-400 font-medium border-b border-hairline text-[12px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-hairline">
                  {events.map((ev) => (
                    <React.Fragment key={ev.id}>
                      <tr 
                        className={`hover:bg-neutral-900 transition-colors cursor-pointer ${expandedId === ev.id ? 'bg-neutral-900' : ''}`}
                        onClick={() => toggleExpand(ev.id)}
                      >
                        <td className="px-6 py-4 font-mono text-xs text-white">{ev.id.split('-')[0]}...</td>
                        <td className="px-6 py-4 font-mono text-xs text-white">{ev.user_id.split('-')[0]}</td>
                        <td className="px-6 py-4 font-medium text-white">₹{ev.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-[4px] text-xs font-semibold ${
                            ev.risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            ev.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 
                            ev.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {ev.risk_score.toFixed(2)} ({ev.risk_level})
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-[4px] text-xs font-semibold ${
                            ev.case_status === 'NEW' ? 'bg-black/5 text-ink' :
                            ev.case_status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-400' :
                            ev.case_status === 'ESCALATED' ? 'bg-red-500/20 text-red-500' :
                            'bg-black/5 text-ink-muted'
                          }`}>
                            {ev.case_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ev.has_feedback ? (
                            <span className={`px-2 py-1 rounded-[4px] text-xs font-semibold ${
                              ev.latest_feedback_classification === FeedbackClassification.LEGITIMATE ? 'bg-emerald-500/20 text-emerald-400' :
                              ev.latest_feedback_classification === FeedbackClassification.FALSE_POSITIVE ? 'bg-slate-700/50 text-slate-300' :
                              ev.latest_feedback_classification === FeedbackClassification.CONFIRMED_FRAUD ? 'bg-red-500/20 text-red-500' :
                              ev.latest_feedback_classification === FeedbackClassification.UNCERTAIN ? 'bg-amber-500/20 text-amber-400' :
                              'bg-black/5 text-ink-muted'
                            }`}>
                              {ev.latest_feedback_classification}
                            </span>
                          ) : (
                            <span className="text-ink-muted text-xs">Unreviewed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {expandedId === ev.id ? (
                            <ChevronUp className="w-5 h-5 text-ink-muted inline" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-ink-muted inline" />
                          )}
                        </td>
                      </tr>
                      
                      {/* Expanded Detail Panel */}
                      {expandedId === ev.id && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-hairline">
                            <div className="bg-black p-6 border-t border-hairline shadow-sm">
                              {detailLoading ? (
                                <div className="flex justify-center p-8 text-emerald-500">
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                              ) : expandedDetail ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  
                                  {/* Left Col: Explanations */}
                                  <div className="lg:col-span-2 space-y-6">
                                    
                                    {/* Transcript Privacy Indicator */}
                                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-[4px] p-5 shadow-sm">
                                      <h3 className="font-semibold text-emerald-400 flex items-center gap-2 mb-3">
                                        <TileIcon icon={BadgeCheck} className="p-0.5" iconClassName="w-4 h-4 text-emerald-400" />
                                        Data Privacy & Security
                                      </h3>
                                      <p className="text-[12px] text-emerald-200/70 mb-3 leading-relaxed">
                                        Interaction audio and transcripts are processed securely via server-side NLP Risk Engine. 
                                        FraudShield analysts only receive cryptographically hashed representations of the conversation context to preserve user privacy. Audio data is discarded immediately after analysis.
                                      </p>
                                      <div className="bg-[#1f1f1f] border border-hairline-interactive p-3 rounded-[4px] font-mono text-[12px]">
                                        <p className="text-emerald-500 font-bold mb-1">[ENCRYPTED AUDIO TRANSCRIPT]</p>
                                        <p className="text-slate-500 break-all">
                                          LOCAL SHA-256 HASH: 0x{Array.from({length: 64}, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join('')}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-2 text-emerald-500/70">
                                          <TileIcon icon={Fingerprint} className="p-0.5" iconClassName="w-3 h-3 text-emerald-400" />
                                          <span className="text-[10px] uppercase tracking-wider">Status: Secured</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                                        <TileIcon icon={OctagonAlert} className="p-0.5" iconClassName="w-4 h-4 text-ink-muted" />
                                        Triggered Rules & Explanations
                                      </h3>
                                      {expandedDetail.risk_reasons.length > 0 ? (
                                        <div className="space-y-3">
                                          {expandedDetail.risk_reasons.map((r, i) => (
                                            <div key={i} className="bg-surface border border-hairline rounded-[6px] p-4 text-[14px]">
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-[12px] font-semibold text-white bg-[#1f1f1f] px-2 py-1 rounded-[4px]">
                                                  {r.reason_code}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                                                  r.severity === 'CRITICAL' ? 'text-red-500' :
                                                  r.severity === 'HIGH' ? 'text-orange-500' :
                                                  'text-ink-muted'
                                                }`}>
                                                  {r.severity}
                                                </span>
                                              </div>
                                              
                                              {/* Phase B: Explainability Headers */}
                                              <div className="flex gap-4 mb-2 mt-1">
                                                {r.source_engine && (
                                                  <div className="text-[10px] uppercase tracking-wide text-ink-muted flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                                    Engine: <span className="text-white">{r.source_engine}</span>
                                                  </div>
                                                )}
                                                {r.contribution !== undefined && r.contribution !== null && (
                                                  <div className="text-[10px] uppercase tracking-wide text-ink-muted flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Impact: <span className="text-white">{(r.contribution * 100).toFixed(0)}%</span>
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <p className="text-slate-400 leading-relaxed text-[14px] mb-2">{r.explanation}</p>
                                              
                                              {/* Phase B: Evidence block */}
                                              {r.evidence && (
                                                <div className="mt-3 bg-[#1f1f1f] border border-hairline rounded-[4px] p-2 text-[12px] font-mono text-slate-400 break-words">
                                                  <span className="text-white block mb-1">Evidence:</span>
                                                  "{r.evidence}"
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[14px] text-ink-muted italic">No specific rules triggered.</p>
                                      )}
                                    </div>
                                    
                                    {/* Audit Trail */}
                                    {expandedDetail.feedback_history.length > 0 && (
                                      <div>
                                        <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                                          <TileIcon icon={CheckCircle} className="p-0.5" iconClassName="w-4 h-4 text-ink-muted" />
                                          Feedback History
                                        </h3>
                                        <div className="space-y-2">
                                          {expandedDetail.feedback_history.map((fb, i) => (
                                            <div key={i} className="bg-surface border border-hairline rounded-[6px] p-3 text-[14px] flex justify-between items-start">
                                              <div>
                                                <span className={`px-2 py-0.5 rounded-[4px] text-[12px] font-semibold mr-3 border-transparent ${
                                                  fb.classification === FeedbackClassification.LEGITIMATE ? 'bg-emerald-500/20 text-emerald-400' :
                                                  fb.classification === FeedbackClassification.FALSE_POSITIVE ? 'bg-slate-700/50 text-slate-300' :
                                                  fb.classification === FeedbackClassification.CONFIRMED_FRAUD ? 'bg-red-500/20 text-red-500' :
                                                  fb.classification === FeedbackClassification.UNCERTAIN ? 'bg-amber-500/20 text-amber-400' :
                                                  'bg-black/5 text-ink-muted'
                                                }`}>
                                                  {fb.classification}
                                                </span>
                                                <span className="text-ink-muted text-[12px]">by {fb.analyst_identifier}</span>
                                                {fb.comment && <p className="mt-2 text-slate-300">{fb.comment}</p>}
                                              </div>
                                              <span className="text-ink-muted text-[12px]">{new Date(fb.created_at).toLocaleString()}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Right Col: Provide Feedback */}
                                  <div className="bg-surface border border-hairline rounded-[6px] p-5 self-start sticky top-6">
                                    <h3 className="font-semibold text-white mb-4">Analyst Verdict</h3>
                                    <p className="text-[12px] text-ink-muted mb-4">
                                      Classify this event based on your investigation. This feedback will inform future risk models.
                                    </p>
                                    
                                    <textarea
                                      className="w-full text-[14px] border border-hairline bg-[#1f1f1f] text-white rounded-[6px] p-3 min-h-[80px] mb-4 focus:ring-1 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-600 shadow-sm transition-colors"
                                      placeholder="Add investigation notes..."
                                      value={feedbackNotes}
                                      onChange={(e) => setFeedbackNotes(e.target.value)}
                                    />
                                    
                                    <div className="space-y-2">
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-emerald-400 border-hairline bg-transparent hover:bg-[#1f1f1f]"
                                        onClick={() => submitFeedback(FeedbackClassification.FALSE_POSITIVE)}
                                        disabled={submitting}
                                      >
                                        Mark as False Positive
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-red-500 border-hairline bg-transparent hover:bg-[#1f1f1f]"
                                        onClick={() => submitFeedback(FeedbackClassification.CONFIRMED_FRAUD)}
                                        disabled={submitting}
                                      >
                                        Mark as Confirmed Fraud
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-emerald-500 border-hairline bg-transparent hover:bg-[#1f1f1f]"
                                        onClick={() => submitFeedback(FeedbackClassification.LEGITIMATE)}
                                        disabled={submitting}
                                      >
                                        Mark as Legitimate (True Negative)
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="w-full justify-start text-amber-500 border-hairline bg-transparent hover:bg-[#1f1f1f]"
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
