import React, { useState } from 'react';
import { Settings, Save, Check, Laptop, Cloud, Webhook, FolderGit2 } from 'lucide-react';
import { EcosystemConfig } from '../types/kingdom';

interface EcosystemConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EcosystemConfig;
  onSaveConfig: (updated: Partial<EcosystemConfig>) => void;
}

export const EcosystemConfigModal: React.FC<EcosystemConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [form, setForm] = useState<EcosystemConfig>({ ...config });
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Ecosystem &amp; Engine Configuration</h2>
              <p className="text-[11px] text-slate-400">
                Configure your local Unity engine path and external AI Sprite / Media webhooks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Execution Mode */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1 text-[11px] uppercase tracking-wider">
              Execution Daemon Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, executionMode: 'sandbox' })}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  form.executionMode === 'sandbox'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Cloud Sandbox</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Simulates Unity CLI, builds, and logs directly in browser
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, executionMode: 'local_pc' })}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  form.executionMode === 'local_pc'
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Laptop className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">Local PC Daemon</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Spawns real Unity.exe batchmode and writes to disk
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Unity Paths */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              Unity Editor Executable Path (unityExePath)
            </label>
            <input
              type="text"
              value={form.unityExePath}
              onChange={(e) => setForm({ ...form, unityExePath: e.target.value })}
              placeholder="C:/Program Files/Unity/Hub/Editor/2022.3.20f1/Editor/Unity.exe"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              Unity Project Directory Path (unityProjectPath)
            </label>
            <input
              type="text"
              value={form.unityProjectPath}
              onChange={(e) => setForm({ ...form, unityProjectPath: e.target.value })}
              placeholder="C:/Users/YourName/Documents/UnityKingdomGame"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Webhooks */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-slate-400 font-semibold block mb-1">
              External Sprite Builder Webhook API
            </label>
            <input
              type="text"
              value={form.spriteWebhookUrl}
              onChange={(e) => setForm({ ...form, spriteWebhookUrl: e.target.value })}
              placeholder="http://localhost:8080/generate-sprite or https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1">
              External Media &amp; Audio Generator Webhook API
            </label>
            <input
              type="text"
              value={form.mediaWebhookUrl}
              onChange={(e) => setForm({ ...form, mediaWebhookUrl: e.target.value })}
              placeholder="http://localhost:8080/generate-audio or https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* WebSocket Port & Auto-Sync */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">
                Local WebSocket Port
              </label>
              <input
                type="number"
                value={form.localWsPort}
                onChange={(e) =>
                  setForm({ ...form, localWsPort: parseInt(e.target.value, 10) || 8080 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.autoSync}
                  onChange={(e) => setForm({ ...form, autoSync: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Auto-sync JSON on change</span>
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
