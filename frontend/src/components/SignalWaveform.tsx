import React, { useEffect, useRef, useState } from 'react';

interface SignalWaveformProps {
  className?: string;
  height?: number;
  noiseOverride?: number | null;
}

export const SignalWaveform: React.FC<SignalWaveformProps> = ({
  className = '',
  height = 240,
  noiseOverride = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentNoise, setCurrentNoise] = useState<number>(0.04);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Connect to SSE health stream
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/stream/health');
      es.onopen = () => setIsConnected(true);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.overall_signal_noise !== undefined) {
            setCurrentNoise(data.overall_signal_noise);
          }
          if (data.active_faults_count !== undefined) {
            setActiveCount(data.active_faults_count);
          }
        } catch (e) {
          // ignore parsing error
        }
      };
      es.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      setIsConnected(false);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const effectiveNoise = noiseOverride !== null ? noiseOverride : currentNoise;

  // Render canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let t = 0;
    let smoothedNoise = effectiveNoise;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = height;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Smooth noise transition
      smoothedNoise += (effectiveNoise - smoothedNoise) * 0.05;

      const centerY = h / 2;
      const numLines = 3;

      for (let layer = 0; layer < numLines; layer++) {
        ctx.beginPath();
        const layerAlpha = layer === 0 ? 0.9 : 0.25 - layer * 0.08;
        const speed = (0.015 + layer * 0.005) * (1 + smoothedNoise * 1.5);
        const freq = 0.008 + layer * 0.004;
        const amp = (h * 0.25) * (1 + layer * 0.2) * (1 + smoothedNoise * 0.6);

        // Color shifts to amber/crimson when distorted
        let strokeColor = '#EDEAE3';
        if (smoothedNoise > 0.4) {
          strokeColor = smoothedNoise > 0.7 ? '#EF4444' : '#F59E0B';
        } else if (layer === 0 && isConnected) {
          strokeColor = '#10B981';
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = layer === 0 ? 1.5 : 1;
        ctx.globalAlpha = layerAlpha;

        for (let x = 0; x < w; x += 2) {
          // Base harmonic
          let y = Math.sin(x * freq + t * speed) * amp;

          // Second harmonic
          y += Math.sin(x * freq * 2.3 - t * speed * 1.2) * (amp * 0.4);

          // Add jitter/distortion when noise is high
          if (smoothedNoise > 0.1) {
            const jitterScale = smoothedNoise * 28.0;
            const noiseFactor = Math.sin(x * 0.09 + t * 0.2) * Math.cos(x * 0.04 - t * 0.1);
            y += noiseFactor * jitterScale;
          }

          const drawY = centerY + y;
          if (x === 0) {
            ctx.moveTo(x, drawY);
          } else {
            ctx.lineTo(x, drawY);
          }
        }
        ctx.stroke();
      }

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(237, 234, 227, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      ctx.restore();

      t += 1;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [effectiveNoise, height, isConnected]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute top-3 left-4 flex items-center gap-3 z-10 font-mono text-[11px] tracking-widest uppercase">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              effectiveNoise > 0.4
                ? 'bg-signal-alert animate-ping'
                : isConnected
                ? 'bg-signal'
                : 'bg-bone-muted'
            }`}
          />
          <span className="text-bone-muted">
            {isConnected ? 'LIVE TELEMETRY STREAM' : 'SIMULATED OSCILLOSCOPE'}
          </span>
        </span>
        <span className="text-bone-dim">/</span>
        <span className={effectiveNoise > 0.4 ? 'text-signal-alert' : 'text-bone'}>
          NOISE {effectiveNoise.toFixed(2)}{' '}
          {effectiveNoise > 0.4 ? '[DISTORTION]' : '[NOMINAL]'}
        </span>
      </div>

      <div className="absolute top-3 right-4 z-10 font-mono text-[11px] tracking-widest text-bone-muted uppercase">
        ACTIVE FAULTS: <span className="text-bone font-medium">{activeCount}</span>
      </div>

      <canvas
        ref={canvasRef}
        style={{ height: `${height}px` }}
        className="w-full block bg-ink-soft hairline-all"
      />
    </div>
  );
};

