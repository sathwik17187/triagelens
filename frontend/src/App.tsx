import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { CustomCursor } from './components/CustomCursor';
import { ServiceTicker } from './components/ServiceTicker';
import { LandingView } from './views/LandingView';
import { ConsoleView } from './views/ConsoleView';
import { IncidentDetailView } from './views/IncidentDetailView';
import { CaseLibraryView } from './views/CaseLibraryView';
import {
  fetchFaults,
  createIncident,
  getIncidents,
  getIncident,
  analyzeIncident,
  resolveIncident,
} from './services/api';
import { Fault, Incident, ServiceHealth } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'console' | 'detail' | 'library'>('landing');
  const [faults, setFaults] = useState<Fault[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Initial data loading
  useEffect(() => {
    loadData();
    // SSE stream listener for service health
    let es: EventSource | null = null;
    try {
      es = new EventSource('/stream/health');
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.services)) {
            setServices(data.services);
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  const loadData = async () => {
    try {
      const [faultsData, incidentsData] = await Promise.all([
        fetchFaults().catch(() => []),
        getIncidents().catch(() => []),
      ]);
      setFaults(faultsData);
      setIncidents(incidentsData);

      // Check if there is an active incident
      const active = incidentsData.find((i) => i.status === 'active' || i.status === 'analyzing');
      if (active) {
        setActiveIncident(active);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  const handleInjectFault = async (faultName: string, variant?: string) => {
    try {
      const inc = await createIncident(faultName, variant);
      setActiveIncident(inc);
      setIncidents((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);
      // Refresh faults to show active state
      const updatedFaults = await fetchFaults();
      setFaults(updatedFaults);
    } catch (e) {
      console.error('Failed to inject fault:', e);
    }
  };

  const handleAnalyzeIncident = async () => {
    if (!activeIncident) return;
    setIsAnalyzing(true);
    try {
      const analyzed = await analyzeIncident(activeIncident.id);
      setActiveIncident(analyzed);
      setSelectedIncident(analyzed);
      setIncidents((prev) => [analyzed, ...prev.filter((i) => i.id !== analyzed.id)]);
      setCurrentView('detail');
    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResolveIncident = async (id?: string) => {
    const incId = id || activeIncident?.id;
    if (!incId) return;
    try {
      const resolved = await resolveIncident(incId);
      if (activeIncident?.id === incId) {
        setActiveIncident(null);
      }
      if (selectedIncident?.id === incId) {
        setSelectedIncident(resolved);
      }
      setIncidents((prev) => [resolved, ...prev.filter((i) => i.id !== resolved.id)]);
      const updatedFaults = await fetchFaults();
      setFaults(updatedFaults);
    } catch (e) {
      console.error('Resolve failed:', e);
    }
  };

  const handleSelectIncidentDetail = async (id: string) => {
    try {
      const inc = await getIncident(id);
      setSelectedIncident(inc);
      setCurrentView('detail');
    } catch (e) {
      console.error('Failed to load incident detail:', e);
    }
  };

  return (
    <div className="relative min-h-screen bg-ink text-bone font-sans selection:bg-bone selection:text-ink">
      <CustomCursor />

      {/* Top Header & Navigation */}
      <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur-md hairline-b">
        <div className="px-6 md:px-12 py-4 flex items-center justify-between max-w-[1500px] mx-auto">
          {/* Brand */}
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-3 group text-left"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-signal group-hover:scale-125 transition-transform" />
            <span className="font-serif text-2xl tracking-tight text-bone font-normal">
              TriageLens
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-bone-dim hidden sm:inline">
              // SUPPORT COPILOT
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider">
            <button
              onClick={() => setCurrentView('landing')}
              className={`transition-colors ${
                currentView === 'landing' ? 'text-bone font-medium' : 'text-bone-muted hover:text-bone'
              }`}
            >
              Manifesto
            </button>
            <button
              onClick={() => setCurrentView('console')}
              className={`flex items-center gap-1.5 transition-colors ${
                currentView === 'console' ? 'text-bone font-medium' : 'text-bone-muted hover:text-bone'
              }`}
            >
              <span>Console</span>
              {activeIncident && <span className="w-1.5 h-1.5 rounded-full bg-signal-alert animate-ping" />}
            </button>
            <button
              onClick={() => setCurrentView('library')}
              className={`transition-colors ${
                currentView === 'library' ? 'text-bone font-medium' : 'text-bone-muted hover:text-bone'
              }`}
            >
              Case Library
            </button>
          </nav>
        </div>

        {/* Live Service Ticker */}
        <ServiceTicker />
      </header>

      {/* Main View Router */}
      <main className="min-h-[calc(100vh-140px)]">
        {currentView === 'landing' && (
          <LandingView
            onEnterConsole={() => setCurrentView('console')}
            onViewLibrary={() => setCurrentView('library')}
          />
        )}

        {currentView === 'console' && (
          <ConsoleView
            faults={faults}
            activeIncident={activeIncident}
            services={services}
            isAnalyzing={isAnalyzing}
            onInjectFault={handleInjectFault}
            onAnalyzeIncident={handleAnalyzeIncident}
            onResolveIncident={() => handleResolveIncident()}
            onNavigateToDetail={(id) => handleSelectIncidentDetail(id)}
          />
        )}

        {currentView === 'detail' && selectedIncident && (
          <IncidentDetailView
            incident={selectedIncident}
            onBack={() => setCurrentView('console')}
            onResolve={handleResolveIncident}
          />
        )}

        {currentView === 'library' && (
          <CaseLibraryView
            incidents={incidents}
            onSelectIncident={handleSelectIncidentDetail}
            onEnterConsole={() => setCurrentView('console')}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="mt-20 py-8 hairline-t bg-ink-soft">
        <div className="px-6 md:px-12 max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-bone-muted">
          <div className="flex items-center gap-3">
            <span>TRIAGELENS // OPEN-SOURCE SUPPORT COPILOT</span>
            <span>•</span>
            <span>OPENTELEMETRY DEMO COMPATIBLE</span>
          </div>
          <div className="text-[11px] text-bone-dim">
            EVAL: 100% TOP-1 DETERMINISTIC & LLM ACCURACY
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

