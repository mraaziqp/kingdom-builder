import React from 'react';
import {
  Hammer,
  RefreshCw,
  Zap,
  Package,
  Play,
  Settings,
  FolderCode,
  Laptop,
  Cloud,
} from 'lucide-react';
import { EcosystemConfig } from '../types/kingdom';

interface HeaderBarProps {
  config: EcosystemConfig;
  onUpdateConfig: (newConfig: Partial<EcosystemConfig>) => void;
  onOpenSettings: () => void;
  onOpenPcSetup: () => void;
  onOpenPresetManager: () => void;
  onInjectBridge: () => void;
  onSyncManifest: () => void;
  onHotReload: () => void;
  onBuildExe: () => void;
  onLaunchGame: () => void;
  isBuilding: boolean;
  isSyncing: boolean;
  isInjected: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  config,
  onUpdateConfig,
  onOpenSettings,
  onOpenPcSetup,
  onOpenPresetManager,
  onInjectBridge,
  onSyncManifest,
  onHotReload,
  onBuildExe,
  onLaunchGame,
  isBuilding,
  isSyncing,
}) => {
  const isLocal = config.executionMode === 'local_pc';

  const toggleExecutionMode = () => {
    onUpdateConfig({
      executionMode: isLocal ? 'sandbox' : 'local_pc',
    });
  };

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-500/20 via-emerald-500/20 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
          <Hammer className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-slate-100">
              KingdomForge
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
              v1.2 // Unity Orchestrator
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>2D Realistic-Arcade Engine</span>
            <span>·</span>
            <span>64 PPU Bottom-Center Pivot</span>
          </div>
        </div>
      </div>

      {/* Mode Switch & Primary Actions */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {/* Execution Mode Toggle */}
        <button
          onClick={toggleExecutionMode}
          title="Click to toggle between Cloud Sandbox and Local PC Daemon"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shrink-0 ${
            isLocal
              ? 'bg-indigo-950/70 border-indigo-600/70 text-indigo-200 hover:bg-indigo-900/50'
              : 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:bg-slate-800/60'
          }`}
        >
          {isLocal ? (
            <Laptop className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isLocal ? 'Local PC Daemon (Live CLI)' : 'Cloud Sandbox (Simulated CLI)'}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isLocal ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </button>

        {/* 1. Inject Bridge */}
        <button
          onClick={onInjectBridge}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-medium transition-all shrink-0"
        >
          <FolderCode className="w-3.5 h-3.5 text-amber-400" />
          <span>Inject C# Bridge</span>
        </button>

        {/* 2. Sync Manifest */}
        <button
          onClick={onSyncManifest}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-medium transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Assets & JSON</span>
        </button>

        {/* 3. Live Hot-Reload */}
        <button
          onClick={onHotReload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-medium transition-all shrink-0"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Hot-Reload</span>
        </button>

        {/* 4. Build .EXE */}
        <button
          onClick={onBuildExe}
          disabled={isBuilding}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 text-xs font-semibold transition-all shrink-0 disabled:opacity-50"
        >
          <Package className={`w-3.5 h-3.5 ${isBuilding ? 'animate-spin' : ''}`} />
          <span>{isBuilding ? 'Compiling Windows64...' : 'Build & Package .EXE'}</span>
        </button>

        {/* 5. Launch Game */}
        <button
          onClick={onLaunchGame}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/40 text-xs font-semibold transition-all shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Game.exe</span>
        </button>
      </div>

      {/* Modals & Tools Trigger */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenPresetManager}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-medium transition-all"
        >
          <FolderCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Saved Presets</span>
        </button>

        <button
          onClick={onOpenPcSetup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-medium transition-all"
        >
          <FolderCode className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">PC Setup &amp; C# Scripts</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Ecosystem Settings & Paths"
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
