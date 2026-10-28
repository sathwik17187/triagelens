import React from 'react';
import { SignalWaveform } from '../components/SignalWaveform';
import { ArrowUpRight, Activity, Terminal, ShieldCheck } from 'lucide-react';

interface LandingViewProps {
  onEnterConsole: () => void;
  onViewLibrary: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onEnterConsole,
  onViewLibrary,
}) => {
  return (
    <div className="w-full page-wipe-enter">
      {/* Manifesto Hero */}
      <section className="relative px-6 md:px-12 pt-16 pb-20 max-w-7xl mx-auto hairline-b">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-bone-muted">
            <span className="w-2 h-2 rounded-full bg-signal" />
            <span>TRIAGELENS // SYSTEM COPILOT V1.0</span>
            <span className="text-bone-dim">/</span>
            <span>OPENTELEMETRY DEMO MESH</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-9xl leading-[0.95] tracking-tight font-normal">
            Autonomous <br />
            <span className="italic font-normal">Incident Triage</span> <br />
            For Microservices.
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 items-end">
            <p className="md:col-span-7 font-sans text-lg md:text-xl text-bone-muted leading-relaxed font-light">
              TriageLens sits directly atop distributed trace telemetry and metric baselines.
              When unexpected faults propagate across the cluster, it correlates evidence,
              ranks suspect services deterministically, and prompts a local LLM to author
              customer updates, engineering tickets, and runbook mitigations.
            </p>

            <div className="md:col-span-5 flex flex-col sm:flex-row gap-4 md:justify-end">
              <button
                onClick={onEnterConsole}
                className="group inline-flex items-center justify-between gap-6 px-6 py-4 bg-bone text-ink hover:bg-bone/90 transition-all font-mono text-xs uppercase tracking-widest"
              >
                <span>Enter Live Console</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={onViewLibrary}
                className="inline-flex items-center justify-center px-6 py-4 bg-ink-soft hairline-all text-bone hover:bg-ink-hover transition-all font-mono text-xs uppercase tracking-widest"
              >
                Case Library
              </button>
            </div>
          </div>
        </div>

        {/* Live Signal Visual Canvas */}
        <div className="mt-16">
          <div className="flex items-center justify-between pb-3 font-mono text-[11px] text-bone-muted uppercase tracking-widest">
            <span>REAL-TIME MESH SIGNAL WAVEFORM</span>
            <span>OSCILLATION PROFILE: 60 FPS</span>
          </div>
          <SignalWaveform height={260} />
        </div>
      </section>

      {/* Editorial Numbered "How It Works" Section */}
      <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto hairline-b">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-bone-muted">
              METHODOLOGY
            </span>
            <h2 className="font-serif text-3xl md:text-4xl">
              Deterministic rigor, <br />
              <span className="italic">accelerated by AI.</span>
            </h2>
            <p className="font-sans text-sm text-bone-muted leading-relaxed font-light mt-2">
              Unlike generic hallucinating chat dashboards, TriageLens implements a strict
              mathematical filter before sending verified evidence IDs to the model.
            </p>
          </div>

          <div className="lg:col-span-8 flex flex-col divide-y divide-[#EDEAE3]/10">
            {/* 01 */}
            <div className="py-8 first:pt-0 grid grid-cols-1 sm:grid-cols-12 gap-6 items-baseline">
              <div className="sm:col-span-2 font-mono text-2xl font-light text-bone-muted">
                01
              </div>
              <div className="sm:col-span-4 font-mono text-sm uppercase tracking-wider text-bone font-medium">
                Telemetry Delta Engine
              </div>
              <div className="sm:col-span-6 font-sans text-sm text-bone-muted leading-relaxed font-light">
                Continuously compares error rate spikes and P95 latency against 15-minute
                sliding Prometheus baselines. Collects Jaeger 5xx span roots and OpenSearch
                exception stacktraces, assigning each an immutable evidence identifier (E1, E2...).
              </div>
            </div>

            {/* 02 */}
            <div className="py-8 grid grid-cols-1 sm:grid-cols-12 gap-6 items-baseline">
              <div className="sm:col-span-2 font-mono text-2xl font-light text-bone-muted">
                02
              </div>
              <div className="sm:col-span-4 font-mono text-sm uppercase tracking-wider text-bone font-medium">
                Transparent Suspect Ranking
              </div>
              <div className="sm:col-span-6 font-sans text-sm text-bone-muted leading-relaxed font-light">
                Calculates transparent weighted suspect scores across all microservices.
                Eliminates guess-work by isolating downstream causes from upstream cascading
                symptoms before invoking the LLM.
              </div>
            </div>

            {/* 03 */}
            <div className="py-8 last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-6 items-baseline">
              <div className="sm:col-span-2 font-mono text-2xl font-light text-bone-muted">
                03
              </div>
              <div className="sm:col-span-4 font-mono text-sm uppercase tracking-wider text-bone font-medium">
                Strict Local Synthesis
              </div>
              <div className="sm:col-span-6 font-sans text-sm text-bone-muted leading-relaxed font-light">
                Sends only the ranked evidence payload to a local Ollama instance under
                strict JSON constraints. Rejects any claim citing hallucinated evidence IDs
                and automatically repairs output within a single validation pass.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications & Metrics Banner */}
      <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="font-mono text-[11px] text-bone-muted uppercase tracking-widest mb-1">
              OBSERVABILITY
            </div>
            <div className="font-serif text-3xl text-bone">OpenTelemetry</div>
            <div className="font-mono text-xs text-bone-dim mt-1">Traces, Metrics, Logs</div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-bone-muted uppercase tracking-widest mb-1">
              INFERENCE
            </div>
            <div className="font-serif text-3xl text-bone">Local Ollama</div>
            <div className="font-mono text-xs text-bone-dim mt-1">Zero Cloud Data Exfiltration</div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-bone-muted uppercase tracking-widest mb-1">
              VERIFICATION
            </div>
            <div className="font-serif text-3xl text-bone">100% Traceable</div>
            <div className="font-mono text-xs text-bone-dim mt-1">Strict Evidence ID Citations</div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-bone-muted uppercase tracking-widest mb-1">
              AUTOMATION
            </div>
            <div className="font-serif text-3xl text-bone">Instant Runbook</div>
            <div className="font-mono text-xs text-bone-dim mt-1">Exportable Markdown</div>
          </div>
        </div>
      </section>
    </div>
  );
};

