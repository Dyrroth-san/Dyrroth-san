import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  formatDuration,
  calculateBinauralFrequencies,
  calculateChannelEffectiveGain,
  generateRandomBalancedMix,
  validateCustomPreset,
  parseImportedPresets,
  INITIAL_CHANNELS,
  SoundChannelState,
} from './soundLogic';

test('clamp restricts values to min and max boundaries', () => {
  assert.equal(clamp(0.5, 0, 1), 0.5);
  assert.equal(clamp(-0.2, 0, 1), 0);
  assert.equal(clamp(1.5, 0, 1), 1);
});

test('formatDuration converts seconds to standard clock format', () => {
  assert.equal(formatDuration(1500), '25:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(9), '00:09');
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(3665), '01:01:05');
});

test('calculateBinauralFrequencies splits carrier around target frequency', () => {
  const alpha = calculateBinauralFrequencies(10, 200);
  assert.equal(alpha.leftHz, 195);
  assert.equal(alpha.rightHz, 205);
  assert.equal(alpha.rightHz - alpha.leftHz, 10);

  const theta = calculateBinauralFrequencies(6, 216);
  assert.equal(theta.leftHz, 213);
  assert.equal(theta.rightHz, 219);
  assert.equal(theta.rightHz - theta.leftHz, 6);
});

test('calculateChannelEffectiveGain respects master volume, mute, solo', () => {
  const channel: SoundChannelState = {
    id: 'rain',
    name: 'Rain',
    category: 'nature',
    volume: 0.8,
    pan: 0,
    active: true,
    muted: false,
    solo: false,
    description: '',
  };

  // Normal active channel
  assert.equal(calculateChannelEffectiveGain(channel, false, 0.5, false), 0.4);

  // Master muted
  assert.equal(calculateChannelEffectiveGain(channel, false, 0.5, true), 0);

  // Channel muted
  assert.equal(calculateChannelEffectiveGain({ ...channel, muted: true }, false, 0.5, false), 0);

  // Inactive channel
  assert.equal(calculateChannelEffectiveGain({ ...channel, active: false }, false, 0.5, false), 0);

  // When another channel is soloed, this non-solo channel is silenced
  assert.equal(calculateChannelEffectiveGain(channel, true, 0.5, false), 0);

  // When this channel itself is soloed
  assert.equal(calculateChannelEffectiveGain({ ...channel, solo: true }, true, 0.5, false), 0.4);
});

test('generateRandomBalancedMix picks 2-4 channels and keeps volumes balanced', () => {
  const mix = generateRandomBalancedMix(INITIAL_CHANNELS, 0.42);
  const activeEntries = Object.entries(mix).filter(([_, conf]) => conf.active);

  assert.ok(activeEntries.length >= 2, 'Should pick at least 2 channels');
  assert.ok(activeEntries.length <= 4, 'Should pick at most 4 channels');

  activeEntries.forEach(([id, conf]) => {
    assert.ok(conf.volume > 0 && conf.volume <= 1, `${id} volume should be valid: ${conf.volume}`);
    assert.ok(conf.pan >= -1 && conf.pan <= 1, `${id} pan should be valid: ${conf.pan}`);
  });
});

test('validateCustomPreset and parseImportedPresets enforce data integrity', () => {
  const validPreset = {
    id: 'custom-1',
    name: 'Deep Rain Focus',
    subtitle: 'Custom setup',
    tag: 'Custom',
    channels: {
      rain: { volume: 0.6, pan: 0, active: true },
      fire: { volume: 0.4, pan: -0.2, active: true },
    },
  };

  assert.equal(validateCustomPreset(validPreset), true);
  assert.equal(validateCustomPreset({}), false);
  assert.equal(validateCustomPreset({ id: '', name: 'Test', channels: {} }), false);
  assert.equal(validateCustomPreset({ id: '1', name: 'Test', channels: { rain: { volume: 2, active: true } } }), false);

  const jsonStr = JSON.stringify([validPreset]);
  const parsed = parseImportedPresets(jsonStr);
  assert.equal(parsed.valid.length, 1);
  assert.equal(parsed.valid[0].name, 'Deep Rain Focus');

  const invalidParsed = parseImportedPresets('invalid json');
  assert.equal(invalidParsed.valid.length, 0);
  assert.ok(invalidParsed.error);
});
