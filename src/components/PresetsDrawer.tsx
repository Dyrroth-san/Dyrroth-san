import React, { useState } from 'react';
import { Preset, serializePresets, parseImportedPresets } from '../utils/soundLogic';
import { Bookmark, Download, Upload, Trash2, Plus, Sparkles, Check } from 'lucide-react';

interface PresetsDrawerProps {
  builtInPresets: Preset[];
  customPresets: Preset[];
  activePresetId?: string;
  onSelectPreset: (preset: Preset) => void;
  onSaveCustomPreset: (name: string, subtitle: string) => void;
  onDeleteCustomPreset: (id: string) => void;
  onImportPresets: (presets: Preset[]) => void;
}

export const PresetsDrawer: React.FC<PresetsDrawerProps> = ({
  builtInPresets,
  customPresets,
  activePresetId,
  onSelectPreset,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onImportPresets,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [newMixName, setNewMixName] = useState('');
  const [newMixSubtitle, setNewMixSubtitle] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMixName.trim()) return;
    onSaveCustomPreset(newMixName.trim(), newMixSubtitle.trim() || 'Custom soundscape balance');
    setNewMixName('');
    setNewMixSubtitle('');
    setIsSaving(false);
  };

  const handleExport = () => {
    const allPresets = [...customPresets];
    const jsonStr = serializePresets(allPresets.length > 0 ? allPresets : builtInPresets);
    navigator.clipboard.writeText(jsonStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = parseImportedPresets(importJsonText);
    if (result.error) {
      setImportError(result.error);
    } else {
      onImportPresets(result.valid);
      setShowImportDialog(false);
      setImportJsonText('');
      setImportError(null);
    }
  };

  return (
    <section aria-label="Soundscapes & Presets" className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Curated Soundscapes & Presets
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Choose an acoustic sanctuary or craft and save your personalized ambient balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaving(!isSaving)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Save Current Mix</span>
          </button>

          <button
            onClick={handleExport}
            title="Copy preset JSON to clipboard"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            {copiedNotification ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedNotification ? 'Copied' : 'Export'}</span>
          </button>

          <button
            onClick={() => setShowImportDialog(true)}
            title="Import custom presets from JSON"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Save Mix Drawer */}
      {isSaving && (
        <form onSubmit={handleSaveSubmit} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/20 dark:bg-amber-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Save Active Mixer Settings
            </h3>
            <button
              type="button"
              onClick={() => setIsSaving(false)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mix-title-input" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Soundscape Title
              </label>
              <input
                id="mix-title-input"
                type="text"
                placeholder="e.g. Rainy Sunday Coding"
                value={newMixName}
                onChange={(e) => setNewMixName(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label htmlFor="mix-desc-input" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description (Optional)
              </label>
              <input
                id="mix-desc-input"
                type="text"
                placeholder="e.g. Rain and Lo-Fi tape with deep alpha beats"
                value={newMixSubtitle}
                onChange={(e) => setNewMixSubtitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors"
            >
              Save to My Presets
            </button>
          </div>
        </form>
      )}

      {/* Built-in Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {builtInPresets.map((preset) => {
          const isCurrent = activePresetId === preset.id;
          const activeChKeys = Object.entries(preset.channels)
            .filter(([_, v]) => v?.active)
            .map(([k]) => k);

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`group flex flex-col justify-between text-left rounded-xl border p-4 transition-all ${
                isCurrent
                  ? 'border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/40 dark:border-amber-500/50 dark:bg-amber-500/10'
                  : 'border-neutral-200/80 bg-white/70 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {preset.name}
                  </h3>
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {preset.tag}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-3">
                  {preset.subtitle}
                </p>
              </div>

              {/* Channels included - clean unboxed typographic separator */}
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800/80 pt-2 flex flex-wrap items-center gap-1.5">
                {activeChKeys.map((k, idx) => (
                  <React.Fragment key={k}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <span className="capitalize">{k}</span>
                  </React.Fragment>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* User Custom Presets Section (if any) */}
      {customPresets.length > 0 && (
        <div className="pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
            My Saved Mixes ({customPresets.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customPresets.map((preset) => {
              const isCurrent = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`flex items-start justify-between rounded-xl border p-3.5 transition-all ${
                    isCurrent
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/60'
                  }`}
                >
                  <button
                    onClick={() => onSelectPreset(preset)}
                    className="flex-1 text-left"
                  >
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {preset.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {preset.subtitle}
                    </p>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPreset(preset.id);
                    }}
                    title="Delete preset"
                    aria-label={`Delete preset ${preset.name}`}
                    className="text-neutral-400 hover:text-red-500 p-1 ml-2 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Import Preset JSON
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Paste the exported JSON text to restore your custom soundscape mixes.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows={5}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="[ { &quot;id&quot;: &quot;...&quot;, &quot;name&quot;: &quot;...&quot; } ]"
                className="w-full font-mono text-xs rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />

              {importError && (
                <p className="text-xs text-red-500">{importError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportDialog(false)}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400"
                >
                  Import Presets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
