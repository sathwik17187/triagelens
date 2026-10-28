import React from 'react';
import { ServiceHealth } from '../types';

interface ServiceTopologyMapProps {
  services: ServiceHealth[];
  selectedService: string | null;
  onSelectService: (service: string) => void;
  faultyServices?: string[];
}

interface NodeCoord {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: 'ingress' | 'core' | 'downstream' | 'async';
}

const NODES: NodeCoord[] = [
  { id: 'loadgenerator', name: 'load-gen', x: 60, y: 150, tier: 'ingress' },
  { id: 'frontend', name: 'frontend', x: 190, y: 150, tier: 'ingress' },
  { id: 'checkout', name: 'checkout', x: 340, y: 150, tier: 'core' },

  { id: 'cart', name: 'cart', x: 490, y: 70, tier: 'downstream' },
  { id: 'payment', name: 'payment', x: 490, y: 130, tier: 'downstream' },
  { id: 'shipping', name: 'shipping', x: 490, y: 190, tier: 'downstream' },
  { id: 'product-catalog', name: 'product-cat', x: 490, y: 250, tier: 'downstream' },

  { id: 'currency', name: 'currency', x: 650, y: 90, tier: 'downstream' },
  { id: 'email', name: 'email', x: 650, y: 150, tier: 'downstream' },
  { id: 'fraud-detection', name: 'fraud-det', x: 650, y: 210, tier: 'async' },

  { id: 'recommendation', name: 'recom', x: 340, y: 270, tier: 'downstream' },
  { id: 'ad', name: 'ad', x: 190, y: 270, tier: 'downstream' },
  { id: 'agent', name: 'agent', x: 340, y: 50, tier: 'downstream' },
  { id: 'quote', name: 'quote', x: 650, y: 270, tier: 'downstream' },
];

const EDGES: [string, string][] = [
  ['loadgenerator', 'frontend'],
  ['frontend', 'checkout'],
  ['frontend', 'recommendation'],
  ['frontend', 'ad'],
  ['frontend', 'agent'],
  ['checkout', 'cart'],
  ['checkout', 'payment'],
  ['checkout', 'shipping'],
  ['checkout', 'product-catalog'],
  ['checkout', 'email'],
  ['checkout', 'currency'],
  ['checkout', 'fraud-detection'],
  ['shipping', 'quote'],
  ['recommendation', 'product-catalog'],
];

export const ServiceTopologyMap: React.FC<ServiceTopologyMapProps> = ({
  services,
  selectedService,
  onSelectService,
  faultyServices = [],
}) => {
  const serviceMap = new Map<string, ServiceHealth>();
  services.forEach((s) => serviceMap.set(s.service, s));

  return (
    <div className="relative w-full h-[360px] bg-ink-soft hairline-all overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 hairline-b bg-ink/60">
        <span className="font-mono text-[11px] tracking-widest text-bone-muted uppercase">
          TOPOLOGY MAP — DISTRIBUTED MICROSERVICES
        </span>
        <span className="font-mono text-[10px] text-bone-dim">
          14 NODES / DIRECTED TRACE EDGES
        </span>
      </div>

      <div className="relative flex-1">
        <svg className="w-full h-full select-none" viewBox="0 0 740 330">
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="rgba(237, 234, 227, 0.2)" />
            </marker>
          </defs>

          {/* Render Connections */}
          {EDGES.map(([srcId, dstId]) => {
            const src = NODES.find((n) => n.id === srcId);
            const dst = NODES.find((n) => n.id === dstId);
            if (!src || !dst) return null;

            const isPathFaulty =
              faultyServices.includes(srcId) || faultyServices.includes(dstId);

            return (
              <line
                key={`${srcId}->${dstId}`}
                x1={src.x}
                y1={src.y}
                x2={dst.x}
                y2={dst.y}
                stroke={isPathFaulty ? 'rgba(239, 68, 68, 0.45)' : 'rgba(237, 234, 227, 0.1)'}
                strokeWidth={isPathFaulty ? '1.5' : '1'}
                strokeDasharray={isPathFaulty ? '3 3' : undefined}
                markerEnd="url(#arrow)"
              />
            );
          })}

          {/* Render Service Nodes */}
          {NODES.map((node) => {
            const health = serviceMap.get(node.id);
            const isFaulty =
              faultyServices.includes(node.id) ||
              (health && (health.status === 'critical' || health.error_rate > 0.1));
            const isSelected = selectedService === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectService(node.id)}
                className="cursor-pointer group"
              >
                {/* Outer halo */}
                {isFaulty && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    className="animate-ping opacity-30"
                  />
                )}

                {/* Node Body */}
                <rect
                  x="-42"
                  y="-14"
                  width="84"
                  height="28"
                  rx="3"
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'fill-bone text-ink stroke-bone stroke-1'
                      : isFaulty
                      ? 'fill-[#2A0E10] stroke-signal-alert stroke-1'
                      : 'fill-[#141417] hover:fill-[#1C1C22] stroke-ink-border stroke-1'
                  }`}
                />

                {/* Status Dot */}
                <circle
                  cx="-30"
                  cy="0"
                  r="3.5"
                  className={
                    isFaulty
                      ? 'fill-signal-alert'
                      : isSelected
                      ? 'fill-ink'
                      : 'fill-signal'
                  }
                />

                {/* Label */}
                <text
                  x="2"
                  y="3.5"
                  textAnchor="middle"
                  className={`font-mono text-[9.5px] uppercase tracking-wider font-medium pointer-events-none ${
                    isSelected ? 'fill-ink' : isFaulty ? 'fill-bone' : 'fill-bone-muted group-hover:fill-bone'
                  }`}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-5 px-4 py-2 hairline-t font-mono text-[10px] text-bone-muted uppercase bg-ink/40">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-signal" /> HEALTHY
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-signal-alert" /> DEGRADED / FAULT
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-bone" /> SELECTED
        </span>
      </div>
    </div>
  );
};

