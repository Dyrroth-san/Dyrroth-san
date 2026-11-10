import React from 'react';
import { Maximize2, Moon, Sun, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface TopNavProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenZen: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeSoundCount: number;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isDark,
  onToggleTheme,
  onOpenZen,
  isPlaying,
  onTogglePlay,
  activeSoundCount,
  activeSection,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-md transition-colors dark:border-neutral-800/80 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single text element in display face, no subtitles) */}
        <button
          onClick={() => onNavigate('mixer')}
          className="text-left font-display text-xl font-bold tracking-tight text-neutral-900 transition-opacity hover:opacity-85 dark:text-neutral-50 whitespace-nowrap shrink-0"
        >
          Komorebi
        </button>

        {/* Zone 2: 4-5 Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => onNavigate('presets')}
            className={`whitespace-nowrap transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
              activeSection === 'presets' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            Soundscapes
          </button>
          <button
            onClick={() => onNavigate('mixer')}
            className={`whitespace-nowrap transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
              activeSection === 'mixer' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            Spatial Mixer
          </button>
          <button
            onClick={() => onNavigate('timer')}
            className={`whitespace-nowrap transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
              activeSection === 'timer' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            Flow Timer
          </button>
          <button
            onClick={() => onNavigate('scratchpad')}
            className={`whitespace-nowrap transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
              activeSection === 'scratchpad' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            Session Notes
          </button>
          <button
            onClick={() => onNavigate('visualizer')}
            className={`whitespace-nowrap transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
              activeSection === 'visualizer' ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
            }`}
          >
            Visualizer
          </button>
        </nav>

        {/* Zone 3: Clean Action Bar with Play State and Zen Mode CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Play/Pause indicator */}
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause master soundscape' : 'Play master soundscape'}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isPlaying
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            {isPlaying ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Playing ({activeSoundCount})</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paused</span>
              </>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Warm Sand Light mode' : 'Switch to Obsidian Dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Primary CTA: Fullscreen Zen Sanctuary */}
          <button
            onClick={onOpenZen}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white transition-transform active:scale-95 hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Zen Mode</span>
          </button>
        </div>
      </div>
    </header>
  );
};
