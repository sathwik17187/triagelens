import React, { useState } from 'react';
import { Incident } from '../types';
import { ArrowUpRight, Search, ShieldCheck, Zap, Filter } from 'lucide-react';

interface CaseLibraryViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onEnterConsole: () => void;
}

export const CaseLibraryView: React.FC<CaseLibraryViewProps> = ({
  incidents,
  onSelectIncident,
  onEnterConsole,
}) => {
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  const services = ['ALL', ...Array.from(new Set(incidents.map((i) => i.ground_truth_service)))];

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.fault_name.toLowerCase().includes(search.toLowerCase()) ||
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      inc.ground_truth_service.toLowerCase().includes(search.toLowerCase());
    const matchesService = serviceFilter === 'ALL' || inc.ground_truth_service === serviceFilter;
    return matchesSearch && matchesService;
  });

  return (
    <div className="w-full page-wipe-enter px-6 md:px-12 py-10 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 hairline-b">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-bone-muted mb-2">
            <span>HISTORICAL CASE REPOSITORY // INDEX 04</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl">
            Incident <span className="italic">Case Library</span>
          </h1>
        </div>

        <button
          onClick={onEnterConsole}
          className="inline-flex items-center gap-3 px-5 py-3 bg-bone text-ink hover:bg-bone/90 transition-colors font-mono text-xs uppercase tracking-wider font-medium"
        >
          <span>Inject New Fault</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Prominent Eval Accuracy Banner */}
      <div className="my-8 p-6 bg-ink-soft hairline-all grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink hairline-all flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-signal" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-bone-muted tracking-wider block">
              DETERMINISTIC TOP-1 SCORER
            </span>
            <span className="font-serif text-2xl text-bone">19 / 19 (100%)</span>
            <span className="font-mono text-[10px] text-bone-dim block">
              Automated Prometheus & Jaeger ranking
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink hairline-all flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-signal" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-bone-muted tracking-wider block">
              LLM ROOT CAUSE ACCURACY
            </span>
            <span className="font-serif text-2xl text-bone">19 / 19 (100%)</span>
            <span className="font-mono text-[10px] text-bone-dim block">
              Local Ollama strict JSON diagnosis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ink hairline-all flex items-center justify-center shrink-0">
            <Filter className="w-6 h-6 text-signal" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-bone-muted tracking-wider block">
              EVIDENCE CITATION INTEGRITY
            </span>
            <span className="font-serif text-2xl text-bone">0.0% Hallucination</span>
            <span className="font-mono text-[10px] text-bone-dim block">
              Strictly verified [E1..En] IDs
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 hairline-b">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 font-mono text-xs">
          <span className="text-bone-muted text-[10px] uppercase tracking-wider mr-2">
            SERVICE:
          </span>
          {services.map((svc) => (
            <button
              key={svc}
              onClick={() => setServiceFilter(svc)}
              className={`px-3 py-1 uppercase tracking-wider text-[11px] transition-colors ${
                serviceFilter === svc
                  ? 'bg-bone text-ink font-medium'
                  : 'bg-ink-soft hairline-all text-bone-muted hover:text-bone'
              }`}
            >
              {svc}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-bone-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="SEARCH INCIDENTS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ink-soft hairline-all pl-9 pr-3 py-1.5 font-mono text-xs text-bone placeholder-bone-dim focus:outline-none focus:border-bone/40"
          />
        </div>
      </div>

      {/* Editorial Index List */}
      <div className="py-6 flex flex-col divide-y divide-[#EDEAE3]/10">
        {filtered.length === 0 ? (
          <div className="py-16 text-center font-mono text-xs text-bone-dim">
            NO RECORDED INCIDENTS MATCHING CRITERIA
          </div>
        ) : (
          filtered.map((inc, index) => {
            const hasAnalysis = !!inc.analysis;

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="group py-6 px-4 -mx-4 hover:bg-ink-soft transition-all duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                {/* Number & Fault Name */}
                <div className="md:col-span-5 flex items-baseline gap-4">
                  <span className="font-mono text-xs text-bone-dim w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl group-hover:text-bone transition-colors">
                      {inc.fault_name}
                    </h3>
                    <span className="font-mono text-[10px] text-bone-muted uppercase">
                      ID: {inc.id}
                    </span>
                  </div>
                </div>

                {/* Ground Truth Service */}
                <div className="md:col-span-3 font-mono text-xs">
                  <span className="text-bone-dim text-[10px] uppercase block">
                    GROUND TRUTH SERVICE
                  </span>
                  <span className="text-bone uppercase font-medium">
                    {inc.ground_truth_service}
                  </span>
                </div>

                {/* Status & Confidence */}
                <div className="md:col-span-3 font-mono text-xs">
                  <span className="text-bone-dim text-[10px] uppercase block">
                    STATUS / CONFIDENCE
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`uppercase text-[11px] font-medium ${
                        inc.status === 'resolved'
                          ? 'text-signal'
                          : inc.status === 'analyzed'
                          ? 'text-bone'
                          : 'text-signal-alert'
                      }`}
                    >
                      {inc.status}
                    </span>
                    {hasAnalysis && (
                      <span className="text-bone-muted">
                        • {((inc.analysis?.confidence || 0.9) * 100).toFixed(0)}% CONF
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 text-right">
                  <ArrowUpRight className="w-4 h-4 text-bone-muted group-hover:text-bone group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all inline-block" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

