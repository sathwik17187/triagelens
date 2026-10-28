import React, { useState } from 'react';
import { Fault, Incident, ServiceHealth } from '../types';
import { ServiceTopologyMap } from '../components/ServiceTopologyMap';
import { SignalWaveform } from '../components/SignalWaveform';
import { ArrowRight, AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';

interface ConsoleViewProps {
  faults: Fault[];
  activeIncident: Incident | null;
  services: ServiceHealth[];
  isAnalyzing: boolean;
  onInjectFault: (faultName: string, variant?: string) => void;
  onAnalyzeIncident: () => void;
  onResolveIncident: () => void;
  onNavigateToDetail: (incidentId: string) => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  faults,
  activeIncident,
  services,
  isAnalyzing,
  onInjectFault,
  onAnalyzeIncident,
  onResolveIncident,
  onNavigateToDetail,
}) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');

  const filteredFaults = faults.filter(
    (f) =>
      f.name.toLowerCase().includes(filterText.toLowerCase()) ||
      f.target_service.toLowerCase().includes(filterText.toLowerCase()) ||
      f.description.toLowerCase().includes(filterText.toLowerCase())
  );

  const selectedServiceHealth = services.find((s) => s.service === selectedService);
  const activeFaultNames = faults.filter((f) => f.is_active).map((f) => f.name);

  return (
    <div className="w-full page-wipe-enter px-6 md:px-12 py-10 max-w-[1500px] mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 hairline-b">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-bone-muted mb-2">
            <span>CONSOLE // REAL-TIME FAULT INJECTION & TRIAGE</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl">
            Microservices <span className="italic">Command Center</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="flex flex-col">
            <span className="text-bone-muted text-[10px] uppercase">REGISTERED FAULTS</span>
            <span className="text-bone font-medium text-lg">{faults.length}</span>
          </div>
          <div className="w-px h-8 bg-ink-border" />
          <div className="flex flex-col">
            <span className="text-bone-muted text-[10px] uppercase">ACTIVE FAULTS</span>
            <span className={`font-medium text-lg ${activeFaultNames.length > 0 ? 'text-signal-alert' : 'text-signal'}`}>
              {activeFaultNames.length}
            </span>
          </div>
          <div className="w-px h-8 bg-ink-border" />
          <div className="flex flex-col">
            <span className="text-bone-muted text-[10px] uppercase">TOPOLOGY NODES</span>
            <span className="text-bone font-medium text-lg">{services.length || 14}</span>
          </div>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        {/* Left Column: Fault Injector */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-bone-muted">
              01 // FAULT INJECTOR ({filteredFaults.length})
            </span>
            <input
              type="text"
              placeholder="FILTER FAULTS..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-ink-soft hairline-all px-2.5 py-1 text-xs font-mono text-bone placeholder-bone-dim focus:outline-none focus:border-bone/40"
            />
          </div>

          <div className="flex flex-col gap-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredFaults.map((fault) => {
              const isActive = fault.is_active || activeIncident?.fault_name === fault.name;

              return (
                <div
                  key={fault.name}
                  className={`p-4 hairline-all transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1C1012] border-signal-alert/40'
                      : 'bg-ink-soft hover:bg-ink-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase font-medium text-bone">
                          {fault.name}
                        </span>
                        <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider bg-ink hairline-all text-bone-muted">
                          {fault.target_service}
                        </span>
                      </div>
                      <p className="text-xs text-bone-muted mt-1 leading-relaxed">
                        {fault.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onInjectFault(fault.name, fault.active_variant)}
                      disabled={isAnalyzing}
                      className={`shrink-0 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest font-medium transition-all ${
                        isActive
                          ? 'bg-signal-alert text-bone hover:bg-signal-alert/80'
                          : 'bg-bone text-ink hover:bg-bone/80'
                      }`}
                    >
                      {isActive ? 'ACTIVE' : 'INJECT'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 hairline-t font-mono text-[10px] text-bone-dim">
                    <span>VARIANT: {fault.active_variant || 'on'}</span>
                    <span>TARGET: {fault.target_service}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Live Topology & Selected Service Telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-bone-muted">
              02 // TOPOLOGY & TRACE MESH
            </span>
            <span className="font-mono text-[11px] text-bone-dim">
              CLICK NODE TO INSPECT
            </span>
          </div>

          <ServiceTopologyMap
            services={services}
            selectedService={selectedService}
            onSelectService={(svc) => setSelectedService(svc)}
            faultyServices={activeIncident ? [activeIncident.ground_truth_service] : []}
          />

          {/* Selected Service Detail Panel */}
          {selectedService && selectedServiceHealth ? (
            <div className="p-4 bg-ink-soft hairline-all">
              <div className="flex items-center justify-between mb-3 font-mono text-xs">
                <span className="text-bone font-medium uppercase tracking-wider">
                  NODE: {selectedServiceHealth.service}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium ${
                    selectedServiceHealth.status === 'critical'
                      ? 'bg-signal-alert/20 text-signal-alert'
                      : 'bg-signal/20 text-signal'
                  }`}
                >
                  {selectedServiceHealth.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div>
                  <span className="text-bone-dim text-[10px] uppercase block">ERROR RATE</span>
                  <span className="text-bone font-medium text-sm">
                    {(selectedServiceHealth.error_rate * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="text-bone-dim text-[10px] uppercase block">P95 LATENCY</span>
                  <span className="text-bone font-medium text-sm">
                    {selectedServiceHealth.p95_latency_ms.toFixed(0)} ms
                  </span>
                </div>
                <div>
                  <span className="text-bone-dim text-[10px] uppercase block">THROUGHPUT</span>
                  <span className="text-bone font-medium text-sm">
                    {selectedServiceHealth.request_rate.toFixed(0)} rps
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-ink-soft hairline-all text-center font-mono text-xs text-bone-dim">
              SELECT A SERVICE NODE FROM THE TOPOLOGY TO INSPECT REAL-TIME METRICS
            </div>
          )}

          {/* Live Waveform Mini */}
          <div className="mt-2">
            <SignalWaveform height={140} />
          </div>
        </div>

        {/* Right Column: Active Incident & Copilot Trigger */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-bone-muted">
              03 // ACTIVE INCIDENT
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                activeIncident ? 'bg-signal-alert animate-ping' : 'bg-bone-dim'
              }`}
            />
          </div>

          {activeIncident ? (
            <div className="p-5 bg-ink-soft hairline-all flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-signal-alert uppercase font-medium">
                  {activeIncident.status === 'analyzed' ? 'ANALYSIS COMPLETE' : 'FAULT ACTIVE'}
                </span>
                <span className="font-mono text-[10px] text-bone-dim">
                  {activeIncident.id}
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] text-bone-dim uppercase block">TRIGGERED FAULT</span>
                <span className="font-mono text-base font-medium text-bone">
                  {activeIncident.fault_name}
                </span>
              </div>

              <div className="p-3 bg-ink hairline-all font-mono text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-bone-dim">GROUND TRUTH:</span>
                  <span className="text-bone font-medium">{activeIncident.ground_truth_service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bone-dim">STARTED:</span>
                  <span className="text-bone-muted">
                    {new Date(activeIncident.start_time).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-bone-dim">STATUS:</span>
                  <span className="text-bone uppercase">{activeIncident.status}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                {activeIncident.status === 'analyzed' ? (
                  <button
                    onClick={() => onNavigateToDetail(activeIncident.id)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-bone text-ink hover:bg-bone/90 transition-all font-mono text-xs uppercase tracking-wider font-medium"
                  >
                    <span>View AI Diagnosis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onAnalyzeIncident}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-bone text-ink hover:bg-bone/90 transition-all font-mono text-xs uppercase tracking-wider font-medium disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running Triage Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Run AI Incident Triage</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={onResolveIncident}
                  disabled={isAnalyzing}
                  className="w-full px-4 py-2.5 bg-ink hairline-all text-bone-muted hover:text-bone hover:border-bone/30 transition-all font-mono text-xs uppercase tracking-wider"
                >
                  Resolve & Reset Flag
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-ink-soft hairline-all flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
              <CheckCircle className="w-8 h-8 text-signal" />
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-bone block mb-1">
                  NO ACTIVE INCIDENT
                </span>
                <p className="text-xs text-bone-muted leading-relaxed font-light max-w-[220px]">
                  Select and inject any fault from the left column to simulate microservice degradation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

