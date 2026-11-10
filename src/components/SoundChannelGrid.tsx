import React, { useState } from 'react';
import {
  SoundChannelState,
  SoundCategory,
  BRAINWAVE_MODES,
  SoundId,
} from '../utils/soundLogic';
import {
  CloudRain,
  CloudLightning,
  Waves,
  Flame,
  Bug,
  Bell,
  Wind,
  Radio,
  Disc,
  Brain,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

interface SoundChannelGridProps {
  channels: SoundChannelState[];
  onChannelToggle: (id: SoundId) => void;
  onVolumeChange: (id: SoundId, volume: number) => void;
  onPanChange: (id: SoundId, pan: number) => void;
  onToggleMute: (id: SoundId) => void;
  onToggleSolo: (id: SoundId) => void;
  binauralHz: number;
  onBinauralHzChange: (hz: number) => void;
}

const ICON_MAP: Record<SoundId, React.ComponentType<{ className?: string }>> = {
  rain: CloudRain,
  thunder: CloudLightning,
  ocean: Waves,
  fire: Flame,
  crickets: Bug,
  birds: Bell,
  wind: Wind,
  whitenoise: Radio,
  brownnoise: Radio,
  binaural: Brain,
  drone: Disc,
};

export const SoundChannelGrid: React.FC<SoundChannelGridProps> = ({
  channels,
  onChannelToggle,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  binauralHz,
  onBinauralHzChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | SoundCategory>('all');

  const filteredChannels = channels.filter(
    (c) => selectedCategory === 'all' || c.category === selectedCategory
  );

  return (
    <section aria-label="Spatial Mixer" className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Spatial Acoustic Elements
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Procedurally synthesized in real-time. Adjust individual volume, stereo panning, and neural entrainment.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800/80">
          {(
            [
              { id: 'all', label: 'All Elements' },
              { id: 'nature', label: 'Nature' },
              { id: 'acoustic', label: 'Noises' },
              { id: 'neural', label: 'Binaural' },
              { id: 'drone', label: 'Lo-Fi Tape' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | SoundCategory)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sound Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((channel) => {
          const Icon = ICON_MAP[channel.id] || Volume2;
          const isBinaural = channel.id === 'binaural';

          return (
            <article
              key={channel.id}
              className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                channel.active
                  ? 'border-neutral-300/90 bg-white dark:border-neutral-700/80 dark:bg-neutral-900 shadow-sm'
                  : 'border-neutral-200/60 bg-neutral-50/60 opacity-70 hover:opacity-100 dark:border-neutral-800/60 dark:bg-neutral-950/60'
              }`}
            >
              <div>
                {/* Header: Icon, Name, Power Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        channel.active
                          ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                          : 'bg-neutral-200/60 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {channel.name}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {channel.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => onChannelToggle(channel.id)}
                    aria-label={`Toggle ${channel.name} generator`}
                    aria-pressed={channel.active}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      channel.active ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        channel.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Binaural Frequency Selector */}
                {isBinaural && channel.active && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <label htmlFor="binaural-band-select" className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Target Brainwave Band
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {BRAINWAVE_MODES.map((b) => (
                        <button
                          key={b.name}
                          onClick={() => onBinauralHzChange(b.hz)}
                          className={`flex flex-col items-center py-1 px-1 rounded-md text-[10px] transition-colors ${
                            binauralHz === b.hz
                              ? 'bg-amber-500 text-neutral-950 font-bold'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          <span>{b.name}</span>
                          <span className="font-mono text-[9px]">{b.hz}Hz</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] text-neutral-500 dark:text-neutral-400 italic">
                      {BRAINWAVE_MODES.find((m) => m.hz === binauralHz)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Fader & Controls Footer */}
              <div className="mt-4 space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                {/* Volume Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    <span>Volume</span>
                    <span className="font-mono tabular-nums">
                      {Math.round(channel.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    disabled={!channel.active}
                    value={channel.volume}
                    onChange={(e) => onVolumeChange(channel.id, parseFloat(e.target.value))}
                    aria-label={`${channel.name} volume`}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 disabled:opacity-40 dark:bg-neutral-800"
                  />
                </div>

                {/* Spatial Stereo Panning Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Compass className="h-3 w-3" />
                      Spatial Pan
                    </span>
                    <span className="font-mono text-[11px] tabular-nums">
                      {channel.pan === 0
                        ? 'Center'
                        : channel.pan < 0
                        ? `${Math.abs(Math.round(channel.pan * 100))}% Left`
                        : `${Math.round(channel.pan * 100)}% Right`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    disabled={!channel.active}
                    value={channel.pan}
                    onChange={(e) => onPanChange(channel.id, parseFloat(e.target.value))}
                    aria-label={`${channel.name} stereo pan`}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-amber-500 disabled:opacity-40 dark:bg-neutral-800"
                  />
                </div>

                {/* Mute and Solo action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onToggleMute(channel.id)}
                      disabled={!channel.active}
                      aria-label={channel.muted ? `Unmute ${channel.name}` : `Mute ${channel.name}`}
                      className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                        channel.muted
                          ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                      }`}
                    >
                      {channel.muted ? 'Muted' : 'Mute'}
                    </button>

                    <button
                      onClick={() => onToggleSolo(channel.id)}
                      disabled={!channel.active}
                      aria-label={channel.solo ? `Unsolo ${channel.name}` : `Solo ${channel.name}`}
                      className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                        channel.solo
                          ? 'border-amber-500/60 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                      }`}
                    >
                      Solo
                    </button>
                  </div>

                  {channel.active && (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      Synthesizing
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
