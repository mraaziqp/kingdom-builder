import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Save,
  Download,
  Upload,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  FileJson,
} from 'lucide-react';
import { KingdomManifest, TownEconomy, SavedPreset } from '../types/kingdom';
import { getInitialManifest } from '../utils/initialManifest';

interface SavedPresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentManifest: KingdomManifest;
  currentEconomy?: TownEconomy;
  onLoadPreset: (preset: SavedPreset) => void;
}

const BUILT_IN_PRESETS: SavedPreset[] = [
  {
    id: 'preset_default_01',
    name: "Founder's Campfire Valley",
    description: 'Balanced medieval starter town with Founder Bram, Elara woodcutter, and Bork mason.',
    createdAt: '2026-10-14T07:00:00Z',
    manifest: getInitialManifest(),
    economy: {
      wood: 120,
      stone: 50,
      food: 90,
      gold: 150,
      morale: 88,
      population: 3,
      housingCap: 6,
    },
  },
  {
    id: 'preset_mountain_02',
    name: 'Ironforge Mountain Outpost',
    description: 'High-production stonemason outpost with high screen-shake and punchy dwarf guild mechanics.',
    createdAt: '2026-10-14T07:05:00Z',
    manifest: {
      ...getInitialManifest(),
      gameTitle: 'Ironforge Mountain Citadel',
      arcadeSettings: {
        placementBounce: 0.9,
        screenShake: 0.75,
        dayNightCycleSpeed: 0.8,
        globalWalkSpeed: 1.5,
      },
    },
    economy: {
      wood: 80,
      stone: 240,
      food: 60,
      gold: 320,
      morale: 82,
      population: 4,
      housingCap: 8,
    },
  },
  {
    id: 'preset_arcade_rush_03',
    name: 'High-Speed Arcade Rush',
    description: 'Maximized elasticity bounce (100%), rapid day-night cycles, and 2.5x villager sprint speed.',
    createdAt: '2026-10-14T07:10:00Z',
    manifest: {
      ...getInitialManifest(),
      gameTitle: 'Arcade Overdrive Kingdom',
      arcadeSettings: {
        placementBounce: 1.0,
        screenShake: 0.85,
        dayNightCycleSpeed: 2.5,
        globalWalkSpeed: 2.4,
      },
    },
    economy: {
      wood: 300,
      stone: 200,
      food: 150,
      gold: 500,
      morale: 95,
      population: 5,
      housingCap: 12,
    },
  },
];

export const SavedPresetManagerModal: React.FC<SavedPresetManagerModalProps> = ({
  isOpen,
  onClose,
  currentManifest,
  currentEconomy,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState<SavedPreset[]>(() => {
    const saved = localStorage.getItem('kingdom_saved_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return BUILT_IN_PRESETS;
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('kingdom_saved_presets', JSON.stringify(presets));
  }, [presets]);

  if (!isOpen) return null;

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2200);
  };

  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: SavedPreset = {
      id: `preset_custom_${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'Custom KingdomForge template layout and settings.',
      createdAt: new Date().toISOString(),
      manifest: JSON.parse(JSON.stringify(currentManifest)),
      economy: currentEconomy
        ? JSON.parse(JSON.stringify(currentEconomy))
        : {
            wood: 100,
            stone: 50,
            food: 80,
            gold: 150,
            morale: 85,
            population: currentManifest.residents.length,
            housingCap: 10,
          },
    };

    setPresets([newPreset, ...presets]);
    setNewPresetName('');
    setNewPresetDesc('');
    showNotify(`Saved "${newPreset.name}" to templates!`);
  };

  const handleDelete = (id: string) => {
    setPresets(presets.filter((p) => p.id !== id));
    showNotify('Template deleted.');
  };

  const handleExportJson = (preset: SavedPreset) => {
    const jsonStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name.toLowerCase().replace(/\\s+/g, '_')}_preset.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && imported.manifest) {
          const formatted: SavedPreset = {
            id: `preset_imported_${Date.now()}`,
            name: imported.name || file.name.replace('.json', ''),
            description: imported.description || 'Imported JSON template',
            createdAt: new Date().toISOString(),
            manifest: imported.manifest,
            economy: imported.economy,
          };
          setPresets([formatted, ...presets]);
          showNotify(`Imported "${formatted.name}"!`);
        } else {
          alert('Invalid preset JSON format: missing manifest data.');
        }
      } catch (err: any) {
        alert(`Failed to parse JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Saved Preset Manager</h2>
              <p className="text-[11px] text-slate-400">
                Save, load, and export entire town setups, arcade sliders, and economy states
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Import JSON button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 px-4 py-2 text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Save Current Snapshot Form */}
          <form
            onSubmit={handleSaveCurrentAsPreset}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Active Setup as New Template</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentManifest.buildings.length} Buildings · {currentManifest.residents.length} Residents
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Preset Name (e.g. Coastal Fishing Haven)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="Description or notes..."
                value={newPresetDesc}
                onChange={(e) => setNewPresetDesc(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!newPresetName.trim()}
                className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>
            </div>
          </form>

          {/* Preset Cards List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                Available Kingdom Templates ({presets.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-100 text-xs">{preset.name}</h3>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-1.5 py-0.5 rounded shrink-0">
                        {preset.manifest.buildings.length} Bldgs · {preset.manifest.residents.length} Res
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>Bounce: {preset.manifest.arcadeSettings.placementBounce}x</span>
                      <span>·</span>
                      <span>Shake: {preset.manifest.arcadeSettings.screenShake}x</span>
                      <span>·</span>
                      <span>Speed: {preset.manifest.arcadeSettings.globalWalkSpeed}x</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        onLoadPreset(preset);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Load Template</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExportJson(preset)}
                        className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                        title="Download JSON Template"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="p-1.5 rounded bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Templates contain full sprite configurations, town grid coords, and arcade sliders.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
