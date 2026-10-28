import React, { useEffect, useState } from 'react';
import { ServiceHealth } from '../types';

const DEFAULT_SERVICES: ServiceHealth[] = [
  { service: 'frontend', error_rate: 0.001, p95_latency_ms: 38, request_rate: 130, status: 'healthy' },
  { service: 'cart', error_rate: 0.002, p95_latency_ms: 28, request_rate: 110, status: 'healthy' },
  { service: 'checkout', error_rate: 0.001, p95_latency_ms: 45, request_rate: 125, status: 'healthy' },
  { service: 'payment', error_rate: 0.000, p95_latency_ms: 52, request_rate: 95, status: 'healthy' },
  { service: 'product-catalog', error_rate: 0.001, p95_latency_ms: 32, request_rate: 140, status: 'healthy' },
  { service: 'shipping', error_rate: 0.002, p95_latency_ms: 40, request_rate: 105, status: 'healthy' },
  { service: 'ad', error_rate: 0.001, p95_latency_ms: 22, request_rate: 160, status: 'healthy' },
  { service: 'recommendation', error_rate: 0.003, p95_latency_ms: 48, request_rate: 90, status: 'healthy' },
  { service: 'fraud-detection', error_rate: 0.000, p95_latency_ms: 26, request_rate: 85, status: 'healthy' },
  { service: 'agent', error_rate: 0.002, p95_latency_ms: 55, request_rate: 70, status: 'healthy' },
  { service: 'email', error_rate: 0.001, p95_latency_ms: 30, request_rate: 80, status: 'healthy' },
  { service: 'currency', error_rate: 0.000, p95_latency_ms: 18, request_rate: 115, status: 'healthy' },
];

export const ServiceTicker: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>(DEFAULT_SERVICES);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/stream/health');
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.services) && data.services.length > 0) {
            setServices(data.services);
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  return (
    <div className="w-full overflow-hidden bg-ink-soft hairline-b hairline-t py-2 select-none">
      <div className="animate-marquee flex items-center gap-8 font-mono text-[11px] uppercase tracking-wider text-bone-muted">
        {/* Render twice for seamless loop */}
        {[...services, ...services].map((svc, i) => {
          const isCritical = svc.status === 'critical' || svc.error_rate > 0.1;
          const isDegraded = svc.status === 'degraded' || svc.p95_latency_ms > 500;

          return (
            <div key={`${svc.service}-${i}`} className="inline-flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCritical
                    ? 'bg-signal-alert animate-ping'
                    : isDegraded
                    ? 'bg-signal-warning'
                    : 'bg-signal'
                }`}
              />
              <span className="text-bone font-medium">{svc.service}</span>
              <span className="text-bone-dim">ERR:</span>
              <span className={isCritical ? 'text-signal-alert' : 'text-bone-muted'}>
                {(svc.error_rate * 100).toFixed(1)}%
              </span>
              <span className="text-bone-dim">P95:</span>
              <span className={isDegraded ? 'text-signal-warning' : 'text-bone-muted'}>
                {svc.p95_latency_ms.toFixed(0)}ms
              </span>
              <span className="text-bone-dim opacity-40 ml-3">/</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

