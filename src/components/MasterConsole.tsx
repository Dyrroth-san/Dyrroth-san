import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Shuffle, RotateCcw, Sliders, Waves, Clock } from 'lucide-react';

interface MasterConsoleProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  masterMuted: boolean;
  onToggleMasterMute: () => void;
  bassGain: number;
  midGain: number;
  trebleGain: number;
  onEQChange: (bass: number, mid: number, treble: number) => void;
  reverbWet: number;
  onReverbChange: (wet: number) => void;
  onRandomizeMix: () => void;
  onResetAllChannels: () => void;
  sleepTimerMinutes: number | null;
  onSetSleepTimer: (mins: number | null) => void;
}

export const MasterConsole: React.FC<MasterConsoleProps> = ({
  isPlaying,
  onTogglePlay,
  masterVolume,
  onMasterVolumeChange,
  masterMuted,
  onToggleMasterMute,
  bassGain,
  midGain,
  trebleGain,
  onEQChange,
  reverbWet,
  onReverbChange,
  onRandomizeMix,
  onResetAllChannels,
  sleepTimerMinutes,
  onSetSleepTimer,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <section aria-label="Master Acoustic Console" className="rounded-2xl border border-neutral-200/80 bg-white/70 backdrop-blur-sm p-4 sm:p-6 dark:border-neutral-800/80 dark:bg-neutral-900/60 shadow-sm transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left: Master Play/Pause & Volume */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause acoustic playback' : 'Start acoustic playback'}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 shadow-md transition-all hover:bg-amber-400 hover:scale-105 active:scale-95 shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex flex-col min-w-[200px] flex-1 sm:flex-initial">
            <div className="flex items-center justify-between gap-3 text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5" />
                Master Volume
              </span>
              <span className="font-mono tabular-nums">
                {masterMuted ? 'Muted' : `${Math.round(masterVolume * 100)}%`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMasterMute}
                aria-label={masterMuted ? 'Unmute master' : 'Mute master'}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors p-1"
              >
                {masterMuted ? (
                  <VolumeX className="h-4 w-4 text-red-500" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterMuted ? 0 : masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                aria-label="Master Volume Slider"
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 dark:bg-neutral-800"
              />
            </div>
          </div>
        </div>

        {/* Center: Reverb Space & Sleep Timer */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-t border-neutral-200/60 pt-4 lg:border-t-0 lg:pt-0 dark:border-neutral-800/60">
          {/* Reverb Slider */}
          <div className="flex flex-col min-w-[150px]">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Waves className="h-3.5 w-3.5" />
                Spatial Reverb
              </span>
              <span className="font-mono tabular-nums">{Math.round(reverbWet * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={reverbWet}
              onChange={(e) => onReverbChange(parseFloat(e.target.value))}
              aria-label="Acoustic Reverb Slider"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 dark:bg-neutral-800"
            />
          </div>

          {/* Sleep Timer Selector */}
          <div className="flex flex-col">
            <label htmlFor="sleep-timer-select" className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              <Clock className="h-3.5 w-3.5" />
              Sleep Timer
            </label>
            <select
              id="sleep-timer-select"
              value={sleepTimerMinutes ?? 'off'}
              onChange={(e) => {
                const val = e.target.value;
                onSetSleepTimer(val === 'off' ? null : parseInt(val, 10));
              }}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <option value="off">Disabled</option>
              <option value="15">15 min fade</option>
              <option value="30">30 min fade</option>
              <option value="45">45 min fade</option>
              <option value="60">60 min fade</option>
            </select>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200/60 pt-4 lg:border-t-0 lg:pt-0 dark:border-neutral-800/60">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showAdvanced
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>3-Band EQ</span>
          </button>

          <button
            onClick={onRandomizeMix}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Harmonize</span>
          </button>

          <button
            onClick={onResetAllChannels}
            title="Silence all active channels"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Silence All</span>
          </button>
        </div>
      </div>

      {/* Collapsible 3-Band Equalizer Drawer */}
      {showAdvanced && (
        <div className="mt-6 pt-4 border-t border-neutral-200/70 dark:border-neutral-800/70 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn">
          {/* Bass */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <span>Low Shelf (250Hz)</span>
              <span className="font-mono tabular-nums">{bassGain > 0 ? `+${bassGain}` : bassGain} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={bassGain}
              onChange={(e) => onEQChange(parseFloat(e.target.value), midGain, trebleGain)}
              aria-label="Bass gain slider"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 dark:bg-neutral-800"
            />
          </div>

          {/* Mids */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <span>Mid Peaking (1000Hz)</span>
              <span className="font-mono tabular-nums">{midGain > 0 ? `+${midGain}` : midGain} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={midGain}
              onChange={(e) => onEQChange(bassGain, parseFloat(e.target.value), trebleGain)}
              aria-label="Mid gain slider"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 dark:bg-neutral-800"
            />
          </div>

          {/* Treble */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <span>High Shelf (4000Hz)</span>
              <span className="font-mono tabular-nums">{trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={trebleGain}
              onChange={(e) => onEQChange(bassGain, midGain, parseFloat(e.target.value))}
              aria-label="Treble gain slider"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 dark:bg-neutral-800"
            />
          </div>
        </div>
      )}
    </section>
  );
};
