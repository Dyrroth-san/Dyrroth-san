import React, { useEffect, useState, useRef } from 'react';
import { Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface ZenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeCount: number;
  currentSoundscapeName: string;
  isDark: boolean;
}

export const ZenOverlay: React.FC<ZenOverlayProps> = ({
  isOpen,
  onClose,
  isPlaying,
  onTogglePlay,
  activeCount,
  currentSoundscapeName,
  isDark,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrame = useRef<number | null>(null);

  // Zen clock
  useEffect(() => {
    if (!isOpen) return;

    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };

    updateTime();
    const timer = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Zen canvas wave animation
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { timeDomainData } = audioEngine.getVisualizerData();

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.6)' : 'rgba(217, 119, 6, 0.7)';

      ctx.beginPath();
      const sliceWidth = width / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0;
        const y = isPlaying ? (v * height) / 2 : centerY + Math.sin(i * 0.05 + angle) * 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.stroke();
      angle += 0.03;
      animFrame.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [isOpen, isPlaying, isDark]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-neutral-950 p-8 text-neutral-100 transition-opacity animate-fadeIn">
      {/* Top Bar: Title & Exit */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-display text-sm font-semibold tracking-wider text-amber-500 uppercase">
            Komorebi Sanctuary
          </span>
          <p className="text-xs text-neutral-400">{currentSoundscapeName}</p>
        </div>

        <button
          onClick={onClose}
          aria-label="Exit Zen mode"
          className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          <Minimize2 className="h-4 w-4" />
          <span>Exit Zen (Esc)</span>
        </button>
      </div>

      {/* Center: Clock & Waveform */}
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="font-mono text-6xl sm:text-7xl font-bold tracking-tight text-neutral-50 tabular-nums">
          {timeStr}
        </div>

        <div className="w-full max-w-xl h-28 overflow-hidden rounded-xl border border-neutral-800/40 bg-neutral-900/20">
          <canvas ref={canvasRef} width={800} height={160} className="w-full h-full" />
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>{isPlaying ? 'Live Procedural Synthesis' : 'Paused'}</span>
          <span aria-hidden="true">·</span>
          <span>{activeCount} active generators</span>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-transform active:scale-95"
        >
          {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
