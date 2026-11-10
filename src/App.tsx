import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SoundChannelState,
  INITIAL_CHANNELS,
  BUILT_IN_PRESETS,
  Preset,
  SoundId,
  generateRandomBalancedMix,
} from './utils/soundLogic';
import { audioEngine } from './audio/audioEngine';
import { TopNav } from './components/TopNav';
import { AudioVisualizer } from './components/AudioVisualizer';
import { MasterConsole } from './components/MasterConsole';
import { SoundChannelGrid } from './components/SoundChannelGrid';
import { PresetsDrawer } from './components/PresetsDrawer';
import { FlowTimer } from './components/FlowTimer';
import { SessionScratchpad } from './components/SessionScratchpad';
import { ZenOverlay } from './components/ZenOverlay';
import { Sparkles, Sliders, Music, Clock, Edit2 } from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('komorebi_theme');
    if (saved) return saved === 'dark';
    return true; // Default dark
  });

  // Sound channels state
  const [channels, setChannels] = useState<SoundChannelState[]>(INITIAL_CHANNELS);
  const [masterVolume, setMasterVolume] = useState<number>(0.75);
  const [masterMuted, setMasterMuted] = useState<boolean>(false);
  const [bassGain, setBassGain] = useState<number>(0);
  const [midGain, setMidGain] = useState<number>(0);
  const [trebleGain, setTrebleGain] = useState<number>(0);
  const [reverbWet, setReverbWet] = useState<number>(0.2);
  const [binauralHz, setBinauralHz] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePresetId, setActivePresetId] = useState<string>('kyoto-rain');
  const [currentSoundscapeName, setCurrentSoundscapeName] = useState<string>('Kyoto Rain Sanctuary');
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [isZenOpen, setIsZenOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('mixer');

  // Custom presets saved in localStorage
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('komorebi_custom_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  // Sync theme with html class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('komorebi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('komorebi_theme', 'light');
    }
  }, [isDark]);

  // Sync custom presets to localStorage
  useEffect(() => {
    localStorage.setItem('komorebi_custom_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  // Sync audio engine with state
  useEffect(() => {
    audioEngine.syncChannels(channels, masterVolume, masterMuted, binauralHz);
  }, [channels, masterVolume, masterMuted, binauralHz]);

  useEffect(() => {
    audioEngine.setMasterVolume(masterMuted ? 0 : masterVolume);
  }, [masterVolume, masterMuted]);

  useEffect(() => {
    audioEngine.setEQ(bassGain, midGain, trebleGain);
  }, [bassGain, midGain, trebleGain]);

  useEffect(() => {
    audioEngine.setReverbWet(reverbWet);
  }, [reverbWet]);

  useEffect(() => {
    audioEngine.setBinauralHz(binauralHz);
  }, [binauralHz]);

  // Sleep Timer countdown & fade
  useEffect(() => {
    if (!sleepTimerMinutes || !isPlaying) return;

    let remainingSeconds = sleepTimerMinutes * 60;
    const interval = window.setInterval(() => {
      remainingSeconds -= 1;
      // Start fading out in the last 60 seconds
      if (remainingSeconds <= 60 && remainingSeconds > 0) {
        const fadeRatio = remainingSeconds / 60;
        audioEngine.setMasterVolume(masterVolume * fadeRatio);
      } else if (remainingSeconds <= 0) {
        audioEngine.pause();
        setIsPlaying(false);
        setSleepTimerMinutes(null);
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [sleepTimerMinutes, isPlaying, masterVolume]);

  // Active channel count
  const activeCount = useMemo(() => {
    return channels.filter((c) => c.active && !c.muted).length;
  }, [channels]);

  // Handlers
  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.play();
      audioEngine.syncChannels(channels, masterVolume, masterMuted, binauralHz);
      setIsPlaying(true);
    }
  }, [isPlaying, channels, masterVolume, masterMuted, binauralHz]);

  const handleChannelToggle = useCallback((id: SoundId) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, active: !ch.active } : ch))
    );
  }, []);

  const handleVolumeChange = useCallback((id: SoundId, volume: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, volume } : ch))
    );
  }, []);

  const handlePanChange = useCallback((id: SoundId, pan: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, pan } : ch))
    );
  }, []);

  const handleToggleMute = useCallback((id: SoundId) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, muted: !ch.muted } : ch))
    );
  }, []);

  const handleToggleSolo = useCallback((id: SoundId) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, solo: !ch.solo } : ch))
    );
  }, []);

  const handleSelectPreset = useCallback((preset: Preset) => {
    setActivePresetId(preset.id);
    setCurrentSoundscapeName(preset.name);

    if (preset.binauralHz) {
      setBinauralHz(preset.binauralHz);
    }

    setChannels((prev) =>
      prev.map((ch) => {
        const conf = preset.channels[ch.id];
        if (conf) {
          return {
            ...ch,
            active: conf.active,
            volume: conf.volume,
            pan: conf.pan !== undefined ? conf.pan : ch.pan,
            muted: false,
            solo: false,
          };
        } else {
          return {
            ...ch,
            active: false,
            muted: false,
            solo: false,
          };
        }
      })
    );

    // Auto-play when selecting preset if not already
    if (!isPlaying) {
      audioEngine.play().then(() => setIsPlaying(true));
    }
  }, [isPlaying]);

  const handleRandomizeMix = useCallback(() => {
    const randomized = generateRandomBalancedMix(channels);
    setActivePresetId('randomized');
    setCurrentSoundscapeName('Algorithmic Harmonic Flow');

    setChannels((prev) =>
      prev.map((ch) => {
        const conf = randomized[ch.id];
        if (conf) {
          return {
            ...ch,
            active: conf.active,
            volume: conf.volume,
            pan: conf.pan,
            muted: false,
            solo: false,
          };
        }
        return { ...ch, active: false };
      })
    );

    if (!isPlaying) {
      audioEngine.play().then(() => setIsPlaying(true));
    }
  }, [channels, isPlaying]);

  const handleResetAllChannels = useCallback(() => {
    setChannels((prev) => prev.map((ch) => ({ ...ch, active: false, muted: false, solo: false })));
  }, []);

  const handleSaveCustomPreset = useCallback((name: string, subtitle: string) => {
    const channelConfig: Preset['channels'] = {};
    channels.forEach((ch) => {
      if (ch.active) {
        channelConfig[ch.id] = { volume: ch.volume, pan: ch.pan, active: true };
      }
    });

    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name,
      subtitle,
      tag: 'Custom Mix',
      channels: channelConfig,
      binauralHz,
      isCustom: true,
    };

    setCustomPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(newPreset.id);
    setCurrentSoundscapeName(name);
  }, [channels, binauralHz]);

  const handleDeleteCustomPreset = useCallback((id: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleImportPresets = useCallback((imported: Preset[]) => {
    setCustomPresets((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const fresh = imported.filter((p) => !existingIds.has(p.id));
      return [...fresh, ...prev];
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        setMasterMuted((m) => !m);
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZenOpen((z) => !z);
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDark((d) => !d);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay]);

  // Section navigation scroll helper
  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col">
      {/* Top Navigation Bar: Strict 3-zone contract */}
      <TopNav
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenZen={() => setIsZenOpen(true)}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        activeSoundCount={activeCount}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Hero Header Area */}
      <section className="relative border-b border-neutral-200/60 bg-white/40 pt-10 pb-8 backdrop-blur-xs dark:border-neutral-800/60 dark:bg-neutral-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Acoustic Architecture & Flow Sanctuary
              </span>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 text-balance">
                Procedural Soundscapes for Uninterrupted Focus
              </h1>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Sculpt custom spatial atmospheres in real-time with Web Audio oscillators, binaural brainwave entrainment, and structured interval timers.
              </p>
            </div>

            {/* Quick Proof Metrics / Status */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col">
                <span className="font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  11
                </span>
                <span>Procedural Elements</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <div className="flex flex-col">
                <span className="font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  0 ms
                </span>
                <span>Buffer Latency</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <div className="flex flex-col">
                <span className="font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  100%
                </span>
                <span>Native Web Audio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Viewport */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: Visualizer */}
        <div id="visualizer" className="scroll-mt-20">
          <AudioVisualizer
            isPlaying={isPlaying}
            activeCount={activeCount}
            currentSoundscapeName={currentSoundscapeName}
            isDark={isDark}
          />
        </div>

        {/* Section 2: Master Console */}
        <MasterConsole
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          masterVolume={masterVolume}
          onMasterVolumeChange={setMasterVolume}
          masterMuted={masterMuted}
          onToggleMasterMute={() => setMasterMuted(!masterMuted)}
          bassGain={bassGain}
          midGain={midGain}
          trebleGain={trebleGain}
          onEQChange={(bass, mid, treble) => {
            setBassGain(bass);
            setMidGain(mid);
            setTrebleGain(treble);
          }}
          reverbWet={reverbWet}
          onReverbChange={setReverbWet}
          onRandomizeMix={handleRandomizeMix}
          onResetAllChannels={handleResetAllChannels}
          sleepTimerMinutes={sleepTimerMinutes}
          onSetSleepTimer={setSleepTimerMinutes}
        />

        {/* Section 3: Presets & Soundscapes */}
        <div id="presets" className="scroll-mt-20">
          <PresetsDrawer
            builtInPresets={BUILT_IN_PRESETS}
            customPresets={customPresets}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onSaveCustomPreset={handleSaveCustomPreset}
            onDeleteCustomPreset={handleDeleteCustomPreset}
            onImportPresets={handleImportPresets}
          />
        </div>

        {/* Section 4: Spatial Mixer Grid */}
        <div id="mixer" className="scroll-mt-20">
          <SoundChannelGrid
            channels={channels}
            onChannelToggle={handleChannelToggle}
            onVolumeChange={handleVolumeChange}
            onPanChange={handlePanChange}
            onToggleMute={handleToggleMute}
            onToggleSolo={handleToggleSolo}
            binauralHz={binauralHz}
            onBinauralHzChange={setBinauralHz}
          />
        </div>

        {/* Section 5: Flow Timer & Scratchpad in 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div id="timer" className="scroll-mt-20">
            <FlowTimer
              onDimAudioForBreak={(dim) => {
                if (dim) {
                  audioEngine.setMasterVolume(masterVolume * 0.3);
                } else {
                  audioEngine.setMasterVolume(masterVolume);
                }
              }}
            />
          </div>

          <div id="scratchpad" className="scroll-mt-20">
            <SessionScratchpad />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200/80 bg-neutral-50/80 py-8 dark:border-neutral-800/80 dark:bg-neutral-950/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-neutral-800 dark:text-neutral-200">
              Komorebi Focus Studio
            </span>
            <span aria-hidden="true">·</span>
            <span>Procedural Acoustic Environment</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-neutral-400">
              Press [Space] to Play/Pause · [M] Mute · [Z] Zen · [D] Theme
            </span>
          </div>
        </div>
      </footer>

      {/* Fullscreen Zen Sanctuary Overlay */}
      <ZenOverlay
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        activeCount={activeCount}
        currentSoundscapeName={currentSoundscapeName}
        isDark={isDark}
      />
    </div>
  );
}
