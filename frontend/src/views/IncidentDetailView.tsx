import React, { useState } from 'react';
import { Incident } from '../types';
import { getExportMarkdownUrl } from '../services/api';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileText,
  Users,
  Shield,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';

interface IncidentDetailViewProps {
  incident: Incident;
  onBack: () => void;
  onResolve: (id: string) => void;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  onBack,
  onResolve,
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'ticket' | 'runbook'>('customer');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [timelineVal, setTimelineVal] = useState<number>(100);

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const analysis = incident.analysis;
  const ticket = analysis?.internal_ticket;

  const ticketMarkdown = ticket
    ? `### ${ticket.title}
**Severity**: ${ticket.severity}
**Suspected Cause**: ${ticket.suspected_cause}

#### Steps to Reproduce:
${ticket.steps_to_reproduce.map((s) => `- ${s}`).join('\n')}

#### Next Actions:
${ticket.next_actions.map((a) => `- ${a}`).join('\n')}`
    : '';

  return (
    <div className="w-full page-wipe-enter px-6 md:px-12 py-10 max-w-[1500px] mx-auto">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between pb-6 hairline-b">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-bone-muted hover:text-bone transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Console</span>
        </button>

        <div className="flex items-center gap-3">
          {incident.status !== 'resolved' && (
            <button
              onClick={() => onResolve(incident.id)}
              className="px-4 py-2 font-mono text-xs uppercase tracking-wider bg-ink-soft hairline-all text-bone hover:border-bone/40 transition-colors"
            >
              Resolve Incident
            </button>
          )}

          <a
            href={getExportMarkdownUrl(incident.id)}
            download={`runbook-${incident.id}.md`}
            className="inline-flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider bg-bone text-ink hover:bg-bone/90 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export Runbook (.md)</span>
          </a>
        </div>
      </div>

      {/* Incident Metadata Banner */}
      <div className="py-8 grid grid-cols-1 md:grid-cols-12 gap-8 hairline-b items-end">
        <div className="md:col-span-8 flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs text-bone-muted">
            <span className="text-signal-alert font-medium">{incident.id}</span>
            <span>/</span>
            <span>GROUND TRUTH: {incident.ground_truth_service}</span>
            <span>/</span>
            <span className="uppercase">{incident.status}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-bone">
            Fault: <span className="italic">{incident.fault_name}</span>
          </h1>
        </div>

        <div className="md:col-span-4 flex flex-col gap-2 font-mono text-xs md:text-right">
          <span className="text-bone-muted">STARTED</span>
          <span className="text-bone font-medium">
            {new Date(incident.start_time).toLocaleString()}
          </span>
          {incident.end_time && (
            <>
              <span className="text-bone-muted mt-1">RESOLVED</span>
              <span className="text-signal font-medium">
                {new Date(incident.end_time).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="py-6 hairline-b">
        <div className="flex items-center justify-between font-mono text-xs text-bone-muted mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-bone-dim" />
            <span className="uppercase tracking-wider">INCIDENT TIMELINE SCRUBBER</span>
          </div>
          <span>WINDOW: T-15m TO T-NOW ({timelineVal}%)</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={timelineVal}
          onChange={(e) => setTimelineVal(Number(e.target.value))}
          className="w-full accent-bone bg-ink-soft h-1.5 cursor-pointer"
        />
        <div className="flex justify-between font-mono text-[10px] text-bone-dim mt-2">
          <span>T-15m Baseline</span>
          <span>Fault Injected</span>
          <span>Triage Analyzed</span>
          <span>Present</span>
        </div>
      </div>

      {/* Main Grid: Evidence Dossier vs AI Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-10">
        {/* Left Column: Suspect Ranking & Evidence Cards */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* Suspect Leaderboard */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-bone-muted">
              DETERMINISTIC SUSPECT RANKING
            </span>
            <div className="flex flex-col divide-y divide-[#EDEAE3]/10 hairline-all bg-ink-soft">
              {incident.ranked_suspects.slice(0, 5).map((suspect) => (
                <div key={suspect.service} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-bone-dim w-5">
                      #{suspect.rank}
                    </span>
                    <div>
                      <span className="font-mono text-sm font-medium text-bone uppercase">
                        {suspect.service}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {suspect.evidence_ids.map((eid) => (
                          <span
                            key={eid}
                            className="px-1 py-0.2 font-mono text-[9px] bg-ink text-bone-muted hairline-all"
                          >
                            {eid}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-bone font-medium block">
                      SCORE: {(suspect.score * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-bone-dim">
                      +{suspect.error_rate_delta > 0 ? (suspect.error_rate_delta * 100).toFixed(1) + '% err' : suspect.latency_p95_delta + 'ms lat'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Dossier */}
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-bone-muted">
              COLLECTED EVIDENCE DOSSIER ({incident.evidence.length})
            </span>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {incident.evidence.map((ev) => (
                <div
                  key={ev.id}
                  id={`evidence-${ev.id}`}
                  className="p-4 bg-ink-soft hairline-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-bone text-ink font-bold text-[10px]">
                        [{ev.id}]
                      </span>
                      <span className="text-bone uppercase font-medium">{ev.service}</span>
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        ev.severity === 'high' ? 'text-signal-alert' : 'text-signal-warning'
                      }`}
                    >
                      {ev.severity} SEVERITY
                    </span>
                  </div>

                  <p className="text-xs text-bone font-light leading-relaxed">
                    {ev.summary}
                  </p>

                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <div className="mt-1 p-2 bg-ink hairline-all font-mono text-[10px] text-bone-muted overflow-x-auto">
                      <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Progressive Diagnosis & Editorial Tabs */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* AI Root Cause Diagnosis Card */}
          {analysis ? (
            <div className="p-6 bg-ink-soft hairline-all flex flex-col gap-5 border-l-2 border-l-bone">
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2 text-bone font-medium">
                  <Sparkles className="w-4 h-4 text-signal" />
                  <span className="tracking-wider uppercase">AI ROOT CAUSE DIAGNOSIS</span>
                </div>
                <div className="flex items-center gap-2 text-bone-muted">
                  <span>CONFIDENCE:</span>
                  <span className="text-bone font-medium">
                    {(analysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] text-bone-dim uppercase">
                  PROBABLE ROOT CAUSE
                </span>
                <p className="font-serif text-2xl text-bone leading-snug">
                  {analysis.probable_root_cause}
                </p>
              </div>

              <div className="flex flex-col gap-1 font-sans text-sm text-bone-muted leading-relaxed font-light">
                <span className="font-mono text-[10px] text-bone-dim uppercase mb-1">
                  EXECUTIVE SUMMARY
                </span>
                <p>{analysis.summary}</p>
              </div>

              {/* Citations */}
              <div className="pt-3 hairline-t flex items-center gap-3 font-mono text-xs">
                <span className="text-bone-dim text-[10px] uppercase">EVIDENCE CITED:</span>
                <div className="flex items-center gap-2">
                  {analysis.evidence_ids_used.map((eid) => (
                    <a
                      key={eid}
                      href={`#evidence-${eid}`}
                      className="px-2 py-0.5 bg-ink text-bone hairline-all hover:border-bone transition-colors text-[10px]"
                    >
                      {eid}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-ink-soft hairline-all text-center font-mono text-xs text-bone-muted">
              Analysis pipeline in progress...
            </div>
          )}

          {/* 3 Editorial Tabs */}
          {analysis && (
            <div className="flex flex-col hairline-all bg-ink-soft">
              {/* Tab Selector */}
              <div className="grid grid-cols-3 hairline-b font-mono text-xs uppercase tracking-wider text-center">
                <button
                  onClick={() => setActiveTab('customer')}
                  className={`py-3.5 transition-colors ${
                    activeTab === 'customer'
                      ? 'bg-ink text-bone font-medium border-b-2 border-b-bone'
                      : 'text-bone-muted hover:text-bone'
                  }`}
                >
                  Customer Update
                </button>
                <button
                  onClick={() => setActiveTab('ticket')}
                  className={`py-3.5 transition-colors ${
                    activeTab === 'ticket'
                      ? 'bg-ink text-bone font-medium border-b-2 border-b-bone'
                      : 'text-bone-muted hover:text-bone'
                  }`}
                >
                  Internal Ticket
                </button>
                <button
                  onClick={() => setActiveTab('runbook')}
                  className={`py-3.5 transition-colors ${
                    activeTab === 'runbook'
                      ? 'bg-ink text-bone font-medium border-b-2 border-b-bone'
                      : 'text-bone-muted hover:text-bone'
                  }`}
                >
                  Runbook Entry
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 relative">
                {/* Copy Button */}
                <button
                  onClick={() => {
                    const text =
                      activeTab === 'customer'
                        ? analysis.customer_update
                        : activeTab === 'ticket'
                        ? ticketMarkdown
                        : analysis.runbook_markdown;
                    copyToClipboard(text, activeTab);
                  }}
                  className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink hairline-all text-bone-muted hover:text-bone font-mono text-[10px] uppercase tracking-wider transition-colors"
                >
                  {copiedTab === activeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-signal" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Tab 1: Customer Update */}
                {activeTab === 'customer' && (
                  <div className="flex flex-col gap-4 max-w-xl">
                    <span className="font-mono text-[10px] text-bone-dim uppercase">
                      PUBLIC STATUS ADVISORY (NON-TECHNICAL // ZERO BLAME)
                    </span>
                    <blockquote className="font-serif text-xl italic text-bone leading-relaxed pl-4 border-l-2 border-l-bone/40">
                      "{analysis.customer_update}"
                    </blockquote>
                  </div>
                )}

                {/* Tab 2: Internal Ticket */}
                {activeTab === 'ticket' && ticket && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-signal-alert/20 text-signal-alert font-mono text-xs font-semibold">
                        {ticket.severity}
                      </span>
                      <h3 className="font-mono text-base font-medium text-bone">
                        {ticket.title}
                      </h3>
                    </div>

                    <div className="font-mono text-xs flex flex-col gap-3 text-bone-muted">
                      <div>
                        <span className="text-bone-dim uppercase block text-[10px]">SUSPECTED CAUSE:</span>
                        <span className="text-bone">{ticket.suspected_cause}</span>
                      </div>

                      <div>
                        <span className="text-bone-dim uppercase block text-[10px]">STEPS TO REPRODUCE:</span>
                        <ul className="list-disc pl-4 mt-1 text-bone space-y-1">
                          {ticket.steps_to_reproduce.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-bone-dim uppercase block text-[10px]">NEXT ACTIONS:</span>
                        <ul className="list-disc pl-4 mt-1 text-bone space-y-1">
                          {ticket.next_actions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Runbook Markdown */}
                {activeTab === 'runbook' && (
                  <div className="flex flex-col gap-3 font-mono text-xs text-bone-muted">
                    <pre className="p-4 bg-ink hairline-all overflow-x-auto text-[11px] leading-relaxed text-bone font-mono whitespace-pre-wrap">
                      {analysis.runbook_markdown}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

