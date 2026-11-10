import React, { useState, useEffect } from 'react';
import { formatDuration } from '../utils/soundLogic';
import { Play, Pause, RotateCcw, SkipForward, Bell, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

export type TimerMode = 'pomodoro' | 'deep' | 'breathwork' | 'stopwatch';

interface FlowTimerProps {
  onTimerIntervalComplete?: () => void;
  onDimAudioForBreak?: (dim: boolean) => void;
}

export const FlowTimer: React.FC<FlowTimerProps> = ({
  onTimerIntervalComplete,
  onDimAudioForBreak,
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [isFocusInterval, setIsFocusInterval] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [autoDimOnBreak, setAutoDimOnBreak] = useState(true);

  // Breathwork 4-7-8 state
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(4);

  // Mode interval durations
  const MODE_DURATIONS: Record<TimerMode, { focus: number; break: number }> = {
    pomodoro: { focus: 25 * 60, break: 5 * 60 },
    deep: { focus: 50 * 60, break: 10 * 60 },
    breathwork: { focus: 4 * 60, break: 1 * 60 },
    stopwatch: { focus: 0, break: 0 },
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setIsFocusInterval(true);
    if (newMode === 'stopwatch') {
      setRemainingSeconds(0);
      setTotalSeconds(1);
    } else {
      const dur = MODE_DURATIONS[newMode].focus;
      setRemainingSeconds(dur);
      setTotalSeconds(dur);
    }
  };

  // Main countdown timer interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (mode === 'stopwatch') {
          return prev + 1;
        }

        if (prev <= 1) {
          // Interval complete!
          audioEngine.playZenChime();

          if (isFocusInterval) {
            setCompletedSessions((c) => c + 1);
            setIsFocusInterval(false);
            const breakDur = MODE_DURATIONS[mode].break;
            setTotalSeconds(breakDur);
            if (autoDimOnBreak && onDimAudioForBreak) {
              onDimAudioForBreak(true);
            }
            onTimerIntervalComplete?.();
            return breakDur;
          } else {
            setIsFocusInterval(true);
            const focusDur = MODE_DURATIONS[mode].focus;
            setTotalSeconds(focusDur);
            if (autoDimOnBreak && onDimAudioForBreak) {
              onDimAudioForBreak(false);
            }
            onTimerIntervalComplete?.();
            return focusDur;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, isFocusInterval, autoDimOnBreak, onDimAudioForBreak, onTimerIntervalComplete]);

  // Breathwork 4-7-8 pacer effect
  useEffect(() => {
    if (mode !== 'breathwork' || !isRunning) return;

    const pacer = window.setInterval(() => {
      setBreathCount((c) => {
        if (c > 1) return c - 1;
        if (breathPhase === 'inhale') {
          setBreathPhase('hold');
          return 7;
        } else if (breathPhase === 'hold') {
          setBreathPhase('exhale');
          return 8;
        } else {
          setBreathPhase('inhale');
          return 4;
        }
      });
    }, 1000);

    return () => window.clearInterval(pacer);
  }, [mode, isRunning, breathPhase]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setRemainingSeconds(0);
    } else {
      const dur = isFocusInterval ? MODE_DURATIONS[mode].focus : MODE_DURATIONS[mode].break;
      setRemainingSeconds(dur);
      setTotalSeconds(dur);
    }
    if (onDimAudioForBreak) onDimAudioForBreak(false);
  };

  const handleSkip = () => {
    if (mode === 'stopwatch') return;
    setIsFocusInterval(!isFocusInterval);
    const nextDur = !isFocusInterval ? MODE_DURATIONS[mode].focus : MODE_DURATIONS[mode].break;
    setRemainingSeconds(nextDur);
    setTotalSeconds(nextDur);
    if (onDimAudioForBreak) onDimAudioForBreak(!isFocusInterval && autoDimOnBreak);
  };

  // Calculate circular SVG progress
  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = 440 - 440 * (mode === 'stopwatch' ? 1 : Math.max(0, Math.min(1 - progressRatio, 1)));

  return (
    <section aria-label="Flow Timer" className="rounded-2xl border border-neutral-200/80 bg-white/70 backdrop-blur-sm p-4 sm:p-6 dark:border-neutral-800/80 dark:bg-neutral-900/60 shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Flow & Interval Timer
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Structured focus blocks with resonant Japanese temple bell intervals.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800/80">
          {(
            [
              { id: 'pomodoro', label: 'Pomodoro 25/5' },
              { id: 'deep', label: 'Deep Focus 50/10' },
              { id: 'breathwork', label: 'Breathwork 4-7-8' },
              { id: 'stopwatch', label: 'Stopwatch' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mode === m.id
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex flex-col items-center justify-center py-4">
        {mode === 'breathwork' && isRunning ? (
          // Breathwork visual pacer
          <div className="flex flex-col items-center justify-center h-48 w-48 rounded-full border-2 border-amber-500/40 bg-amber-500/5 transition-all duration-1000 scale-105">
            <span className="font-display text-lg font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {breathPhase}
            </span>
            <span className="font-mono text-4xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
              {breathCount}
            </span>
            <span className="text-[11px] text-neutral-500 mt-1">4s in · 7s hold · 8s out</span>
          </div>
        ) : (
          // Standard circular progress ring
          <div className="relative flex items-center justify-center">
            <svg className="h-52 w-52 -rotate-90 transform" viewBox="0 0 160 160">
              {/* Track */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-neutral-200 dark:text-neutral-800"
              />
              {/* Progress */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-amber-500 transition-all duration-500 ease-linear"
              />
            </svg>

            {/* Centered Time readout */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
                {mode === 'stopwatch'
                  ? 'Elapsed Flow'
                  : isFocusInterval
                  ? 'Focus Interval'
                  : 'Resting Break'}
              </span>
              <span className="font-mono text-4xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatDuration(remainingSeconds)}
              </span>
              <span className="text-[11px] text-neutral-400 mt-1">
                {isRunning ? 'Running' : 'Paused'}
              </span>
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleStartPause}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition-transform active:scale-95 shadow-xs"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            title="Reset timer"
            aria-label="Reset timer"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {mode !== 'stopwatch' && (
            <button
              onClick={handleSkip}
              title="Skip interval"
              aria-label="Skip to next interval"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          )}

          {/* Test Chime */}
          <button
            onClick={() => audioEngine.playZenChime()}
            title="Preview completion bell"
            aria-label="Test Zen Bell Chime"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>

        {/* Stats & Settings Footer */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              <strong className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {completedSessions}
              </strong>{' '}
              focus blocks completed today
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDimOnBreak}
              onChange={(e) => setAutoDimOnBreak(e.target.checked)}
              className="rounded border-neutral-300 text-amber-500 focus:ring-amber-500 dark:border-neutral-700"
            />
            <span>Auto-dim audio during breaks</span>
          </label>
        </div>
      </div>
    </section>
  );
};
