/**
 * Pure audio configuration, presets, calculation helpers, and state transformations.
 * Decoupled from Web Audio API and React for unit testing and deterministic logic.
 */

export type SoundId =
  | 'rain'
  | 'thunder'
  | 'ocean'
  | 'fire'
  | 'crickets'
  | 'birds'
  | 'wind'
  | 'whitenoise'
  | 'brownnoise'
  | 'binaural'
  | 'drone';

export type SoundCategory = 'nature' | 'acoustic' | 'neural' | 'drone';

export interface SoundChannelState {
  id: SoundId;
  name: string;
  category: SoundCategory;
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 (Left) to 1.0 (Right)
  active: boolean;
  muted: boolean;
  solo: boolean;
  description: string;
}

export type BrainwaveFrequency = {
  name: string;
  tag: string;
  hz: number;
  description: string;
};

export const BRAINWAVE_MODES: BrainwaveFrequency[] = [
  { name: 'Delta', tag: '0.5 - 4 Hz', hz: 2.5, description: 'Deep restorative rest & cellular healing' },
  { name: 'Theta', tag: '4 - 8 Hz', hz: 6.0, description: 'Deep meditation, memory formation & creative flow' },
  { name: 'Alpha', tag: '8 - 13 Hz', hz: 10.0, description: 'Calm alertness, flow state & cognitive ease' },
  { name: 'Beta', tag: '14 - 30 Hz', hz: 18.0, description: 'Active concentration, analytical focus & problem solving' },
  { name: 'Gamma', tag: '30 - 50 Hz', hz: 40.0, description: 'High-level synthesis, memory recall & peak cognition' },
];

export interface Preset {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  channels: Partial<Record<SoundId, { volume: number; pan?: number; active: boolean }>>;
  binauralHz?: number;
  isCustom?: boolean;
}

export const INITIAL_CHANNELS: SoundChannelState[] = [
  { id: 'rain', name: 'Spring Rain', category: 'nature', volume: 0.65, pan: -0.2, active: true, muted: false, solo: false, description: 'Soft procedural rain drops and continuous mist' },
  { id: 'thunder', name: 'Distant Thunder', category: 'nature', volume: 0.35, pan: 0.4, active: false, muted: false, solo: false, description: 'Low resonant atmospheric rumble' },
  { id: 'ocean', name: 'Ocean Swells', category: 'nature', volume: 0.5, pan: 0.0, active: false, muted: false, solo: false, description: 'Rhythmic deep water ebb and flow' },
  { id: 'fire', name: 'Hearth & Ember', category: 'nature', volume: 0.45, pan: -0.3, active: true, muted: false, solo: false, description: 'Gentle wood crackle and warm thermal hum' },
  { id: 'crickets', name: 'Night Cicadas', category: 'nature', volume: 0.3, pan: 0.6, active: false, muted: false, solo: false, description: 'Nocturnal pulses in high summer grass' },
  { id: 'birds', name: 'Forest Chimes', category: 'nature', volume: 0.4, pan: -0.5, active: false, muted: false, solo: false, description: 'Procedural pentatonic bell chimes' },
  { id: 'wind', name: 'Pine Forest Wind', category: 'nature', volume: 0.35, pan: 0.2, active: false, muted: false, solo: false, description: 'Gentle aerodynamic filtered gusting' },
  { id: 'whitenoise', name: 'Smooth Pink Noise', category: 'acoustic', volume: 0.25, pan: 0.0, active: false, muted: false, solo: false, description: '1/f pink noise for masking office conversation' },
  { id: 'brownnoise', name: 'Deep Brown Noise', category: 'acoustic', volume: 0.4, pan: 0.0, active: false, muted: false, solo: false, description: 'Sub-bass waterfall rumble for ADHD focus' },
  { id: 'binaural', name: 'Binaural Frequency', category: 'neural', volume: 0.5, pan: 0.0, active: false, muted: false, solo: false, description: 'Stereo beat difference for brainwave entrainment' },
  { id: 'drone', name: 'Warm Lo-Fi Tape', category: 'drone', volume: 0.4, pan: 0.1, active: true, muted: false, solo: false, description: 'Lush 7th chord analog synth progression' },
];

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'kyoto-rain',
    name: 'Kyoto Rain Sanctuary',
    subtitle: 'Gentle rainfall over traditional cedar tiles with distant hearth warmth',
    tag: 'Deep Focus',
    channels: {
      rain: { volume: 0.7, pan: -0.15, active: true },
      fire: { volume: 0.35, pan: 0.3, active: true },
      drone: { volume: 0.4, pan: 0.0, active: true },
      wind: { volume: 0.2, pan: -0.4, active: true },
    },
  },
  {
    id: 'theta-flow',
    name: 'Theta Flow State',
    subtitle: 'Sub-bass brown noise paired with 6Hz binaural beat for deep immersion',
    tag: 'Cognitive Work',
    binauralHz: 6.0,
    channels: {
      brownnoise: { volume: 0.55, pan: 0.0, active: true },
      binaural: { volume: 0.45, pan: 0.0, active: true },
      birds: { volume: 0.3, pan: -0.5, active: true },
    },
  },
  {
    id: 'pacific-coast',
    name: 'Pacific Coastal Mist',
    subtitle: 'Rolling ocean breakers with coastal breeze and distant rain',
    tag: 'Calm & Reset',
    channels: {
      ocean: { volume: 0.75, pan: 0.1, active: true },
      wind: { volume: 0.35, pan: -0.3, active: true },
      rain: { volume: 0.25, pan: 0.4, active: true },
    },
  },
  {
    id: 'night-study',
    name: 'Midnight Study Loft',
    subtitle: 'Pink noise acoustic floor with soft tape chords and night cicadas',
    tag: 'Night Reading',
    channels: {
      whitenoise: { volume: 0.3, pan: 0.0, active: true },
      drone: { volume: 0.5, pan: 0.1, active: true },
      crickets: { volume: 0.25, pan: 0.5, active: true },
      rain: { volume: 0.3, pan: -0.3, active: true },
    },
  },
  {
    id: 'autumn-hearth',
    name: 'Stargazer Campfire',
    subtitle: 'Fierce crackling firewood under open alpine wind and crickets',
    tag: 'Reflection',
    channels: {
      fire: { volume: 0.75, pan: 0.0, active: true },
      wind: { volume: 0.3, pan: 0.4, active: true },
      crickets: { volume: 0.35, pan: -0.4, active: true },
    },
  },
];

/**
 * Utility: Clamp number between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Formats duration in seconds to "MM:SS" or "HH:MM:SS"
 */
export function formatDuration(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates stereo carrier frequencies for binaural beat generation.
 * e.g. for base carrier 216Hz and target difference 10Hz (Alpha):
 * Left channel: 216 - 5 = 211 Hz
 * Right channel: 216 + 5 = 221 Hz
 */
export function calculateBinauralFrequencies(targetWaveHz: number, baseCarrierHz = 216): { leftHz: number; rightHz: number } {
  const halfDiff = targetWaveHz / 2;
  return {
    leftHz: Math.round((baseCarrierHz - halfDiff) * 100) / 100,
    rightHz: Math.round((baseCarrierHz + halfDiff) * 100) / 100,
  };
}

/**
 * Determines effective channel gain taking master volume, mute, solo states into account.
 */
export function calculateChannelEffectiveGain(
  channel: SoundChannelState,
  hasAnySolo: boolean,
  masterVolume: number,
  masterMuted: boolean
): number {
  if (masterMuted) return 0;
  if (!channel.active || channel.muted) return 0;
  if (hasAnySolo && !channel.solo) return 0;
  return clamp(channel.volume * masterVolume, 0, 1);
}

/**
 * Generates a pleasant, musically balanced random soundscape.
 * Selects 2 to 4 complementary channels and calculates balanced volume weights.
 */
export function generateRandomBalancedMix(
  availableChannels: SoundChannelState[],
  seed = Math.random()
): Partial<Record<SoundId, { volume: number; pan: number; active: boolean }>> {
  if (availableChannels.length === 0) return {};

  // Choose 2 to 4 channels
  const numToPick = 2 + Math.floor(seed * 3); // 2, 3, or 4
  const shuffled = [...availableChannels].sort(() => Math.sin(seed * 9999 + Math.random()) - 0.5);
  const chosen = shuffled.slice(0, numToPick);

  const result: Partial<Record<SoundId, { volume: number; pan: number; active: boolean }>> = {};

  // Set all available channels to inactive first
  availableChannels.forEach((ch) => {
    result[ch.id] = { volume: ch.volume, pan: ch.pan, active: false };
  });

  // Balanced target total volume so it doesn't clip
  const targetPerChannel = Math.round((0.85 / Math.sqrt(chosen.length)) * 100) / 100;

  chosen.forEach((ch, idx) => {
    // Spatial pan spread: alternating left and right
    const panOffset = idx % 2 === 0 ? -0.2 - (idx * 0.15) : 0.2 + (idx * 0.15);
    const volumeJitter = 0.85 + Math.random() * 0.3; // 0.85 - 1.15
    result[ch.id] = {
      volume: clamp(Math.round(targetPerChannel * volumeJitter * 100) / 100, 0.2, 0.85),
      pan: clamp(Math.round(panOffset * 100) / 100, -0.85, 0.85),
      active: true,
    };
  });

  return result;
}

/**
 * Validates whether an imported custom preset object has required shape and values.
 */
export function validateCustomPreset(obj: unknown): obj is Preset {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Partial<Preset>;
  if (typeof p.id !== 'string' || p.id.trim() === '') return false;
  if (typeof p.name !== 'string' || p.name.trim() === '') return false;
  if (!p.channels || typeof p.channels !== 'object') return false;

  for (const [key, val] of Object.entries(p.channels)) {
    if (typeof key !== 'string') return false;
    if (!val || typeof val !== 'object') return false;
    const v = val as { volume?: unknown; active?: unknown; pan?: unknown };
    if (typeof v.volume !== 'number' || v.volume < 0 || v.volume > 1) return false;
    if (typeof v.active !== 'boolean') return false;
    if (v.pan !== undefined && (typeof v.pan !== 'number' || v.pan < -1 || v.pan > 1)) return false;
  }
  return true;
}

/**
 * JSON export/import serialization helper
 */
export function serializePresets(presets: Preset[]): string {
  return JSON.stringify(presets, null, 2);
}

export function parseImportedPresets(jsonText: string): { valid: Preset[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { valid: [], error: 'Expected a JSON array of presets.' };
    }
    const valid = parsed.filter(validateCustomPreset);
    if (valid.length === 0) {
      return { valid: [], error: 'No valid presets found in the provided file.' };
    }
    return { valid };
  } catch {
    return { valid: [], error: 'Invalid JSON format.' };
  }
}
