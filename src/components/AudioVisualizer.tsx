import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { Activity, BarChart2, Disc3 } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  activeCount: number;
  currentSoundscapeName?: string;
  isDark: boolean;
}

type VisualizerMode = 'wave' | 'bars' | 'bloom';

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  activeCount,
  currentSoundscapeName = 'Ambient Atmosphere',
  isDark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('wave');
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particleAngle = 0;

    const render = () => {
      // Dynamic canvas resolution scaling
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const { frequencyData, timeDomainData } = audioEngine.getVisualizerData();

      // Compute average energy
      let sumFreq = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sumFreq += frequencyData[i];
      }
      const avgEnergy = isPlaying ? sumFreq / frequencyData.length : 0;
      const normalizedEnergy = Math.min(avgEnergy / 100, 1.0);

      if (mode === 'wave') {
        // --- OSCILLOSCOPE WAVEFORM ---
        ctx.lineWidth = isDark ? 2.5 : 2;
        ctx.strokeStyle = isDark
          ? isPlaying
            ? 'rgba(245, 158, 11, 0.85)' // Amber gold
            : 'rgba(163, 163, 163, 0.3)'
          : isPlaying
          ? 'rgba(217, 119, 6, 0.85)'
          : 'rgba(115, 115, 115, 0.3)';

        ctx.beginPath();
        const sliceWidth = width / timeDomainData.length;
        let x = 0;

        for (let i = 0; i < timeDomainData.length; i++) {
          const v = timeDomainData[i] / 128.0; // 0..2
          // If not playing, draw calm resting wave
          const waveHeight = isPlaying
            ? (v * height) / 2
            : height / 2 + Math.sin(i * 0.04 + particleAngle) * 3;

          if (i === 0) {
            ctx.moveTo(x, waveHeight);
          } else {
            ctx.lineTo(x, waveHeight);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Secondary soft ambient echo wave
        if (isPlaying) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(217, 119, 6, 0.25)';
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < timeDomainData.length; i += 2) {
            const v = timeDomainData[i] / 128.0;
            const waveHeight = (v * height) / 2 + Math.sin(i * 0.06 + particleAngle * 1.5) * 8;
            if (i === 0) ctx.moveTo(x, waveHeight);
            else ctx.lineTo(x, waveHeight);
            x += sliceWidth * 2;
          }
          ctx.stroke();
        }
      } else if (mode === 'bars') {
        // --- SYMMETRIC FREQUENCY SPECTRUM BARS ---
        const barCount = 48;
        const barWidth = (width / barCount) * 0.65;
        const gap = (width / barCount) * 0.35;
        const centerY = height / 2;

        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.floor((i / barCount) * (frequencyData.length * 0.7));
          const val = isPlaying ? frequencyData[freqIndex] : 4 + Math.sin(i * 0.4 + particleAngle) * 2;
          const barHeight = Math.max(3, (val / 255) * (height * 0.42));

          const x = i * (barWidth + gap) + gap / 2;

          const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          if (isDark) {
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
            gradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.5)');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.9)');
          } else {
            gradient.addColorStop(0, 'rgba(217, 119, 6, 0.9)');
            gradient.addColorStop(0.5, 'rgba(180, 83, 9, 0.4)');
            gradient.addColorStop(1, 'rgba(217, 119, 6, 0.9)');
          }

          ctx.fillStyle = gradient;
          // Top half & Bottom mirror half
          ctx.beginPath();
          ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 2);
          ctx.fill();
        }
      } else if (mode === 'bloom') {
        // --- SACRED RIPPLE GEOMETRY PARTICLES ---
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;
        const rings = 4;

        for (let r = 0; r < rings; r++) {
          const ringRadius = baseRadius + r * 22 + normalizedEnergy * (r * 18);
          const points = 16 + r * 8;

          ctx.beginPath();
          for (let p = 0; p <= points; p++) {
            const angle = (p / points) * Math.PI * 2 + particleAngle * (r % 2 === 0 ? 0.3 : -0.3);
            const freqVal = isPlaying ? frequencyData[(p * 4 + r * 10) % frequencyData.length] / 255 : 0.05;
            const displacement = freqVal * 16 * (isPlaying ? 1 : 0.2);
            const currRadius = ringRadius + displacement;

            const px = centerX + Math.cos(angle) * currRadius;
            const py = centerY + Math.sin(angle) * currRadius;

            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();

          ctx.strokeStyle = isDark
            ? `rgba(245, 158, 11, ${0.15 + (1 - r / rings) * 0.45 * (isPlaying ? 1 : 0.3)})`
            : `rgba(180, 83, 9, ${0.15 + (1 - r / rings) * 0.45 * (isPlaying ? 1 : 0.3)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      particleAngle += 0.02;
      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [mode, isPlaying, isDark]);

  return (
    <section aria-label="Audio Visualizer" className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/70 backdrop-blur-sm transition-all dark:border-neutral-800/80 dark:bg-neutral-900/60 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800/60">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Acoustic Canvas
          </span>
          <h2 className="font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {currentSoundscapeName}
          </h2>
        </div>

        {/* Segmented Mode Selector Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800/80">
          <button
            onClick={() => setMode('wave')}
            aria-label="Waveform Oscilloscope mode"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              mode === 'wave'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Waveform</span>
          </button>
          <button
            onClick={() => setMode('bars')}
            aria-label="Spectrum Frequency Bars mode"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              mode === 'bars'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Spectrum</span>
          </button>
          <button
            onClick={() => setMode('bloom')}
            aria-label="Sacred Ripple Particles mode"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              mode === 'bloom'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            <Disc3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bloom</span>
          </button>
        </div>
      </div>

      {/* Visualizer Canvas Frame */}
      <div className="relative mt-4 h-44 sm:h-52 w-full rounded-xl bg-neutral-950/5 dark:bg-neutral-950/50 flex items-center justify-center overflow-hidden border border-neutral-200/50 dark:border-neutral-800/40">
        <canvas
          ref={canvasRef}
          width={900}
          height={260}
          className="h-full w-full object-contain"
        />

        {/* Ambient overlay info */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{isPlaying ? 'Live Procedural Synthesis' : 'Engine Standing By'}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{activeCount} active generators</span>
        </div>
      </div>
    </section>
  );
};
